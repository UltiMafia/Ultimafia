/**
 * Backfill SetupVersion.setupStats (alignmentRows, roleRows, gameLengthRows) from Game documents.
 *
 * Run: node migrations/backfillSetupStats.js [--limit N]
 * Requires MONGO_URL (or default localhost) and optional dotenv.
 *
 * Skips games with leavers, hadVeg, or missing data. Marks processed games with setupStatsBackfilled.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const mongo = require("mongodb");
const models = require("../db/models");
const logger = require("../modules/logging")("backfillSetupStats");

const ObjectID = mongo.ObjectID;

function parseJson(s, fallback) {
  if (!s || typeof s !== "string") return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function gameTypeTag(game) {
  if (game.competitive) return "competitive";
  if (game.ranked) return "ranked";
  return "unranked";
}

function factionKeyFromMaps(userId, originalRoles, playerIdMap, playerAlignmentMap) {
  const playerId = playerIdMap[userId];
  if (!playerId || !originalRoles[playerId]) return null;
  const roleStr = originalRoles[playerId];
  const roleName = roleStr.split(":")[0];
  const alignment = playerAlignmentMap[userId] || "";
  const alignmentIsFaction =
    alignment === "Village" || alignment === "Mafia" || alignment === "Cult";
  let factionName = alignmentIsFaction ? alignment : roleName;
  if (factionName === "Traitor") factionName = "Mafia";
  return factionName;
}

async function resolveSetupVersionId(setupOid, endTimeMs) {
  const versions = await models.SetupVersion.find({ setup: setupOid })
    .select("version timestamp")
    .sort({ version: 1 })
    .lean();
  if (!versions.length) return null;
  let chosen = versions[0];
  const t = endTimeMs || Date.now();
  for (const v of versions) {
    const ts = v.timestamp ? new Date(v.timestamp).getTime() : 0;
    if (ts <= t) {
      chosen = v;
    }
  }
  return chosen._id;
}

async function processGame(game) {
  const left = game.left || [];
  if (left.length > 0) return { skipped: "leavers" };
  if (game.hadVeg === true) return { skipped: "veg" };
  if (game.type !== "Mafia") return { skipped: "notMafia" };

  const playerIdMap = parseJson(game.playerIdMap, {});
  const playerAlignmentMap = parseJson(game.playerAlignmentMap, {});
  const history = parseJson(game.history, {});
  const originalRoles = history.originalRoles || {};

  const winnerIds = new Set();
  if (Array.isArray(game.winners)) {
    game.winners.forEach((id) => winnerIds.add(id));
  }
  if (game.winnersInfo && Array.isArray(game.winnersInfo.players)) {
    game.winnersInfo.players.forEach((id) => winnerIds.add(id));
  }

  const factionToStarters = {};
  for (const userId of Object.keys(playerIdMap)) {
    const fk = factionKeyFromMaps(
      userId,
      originalRoles,
      playerIdMap,
      playerAlignmentMap
    );
    if (!fk) continue;
    const pid = playerIdMap[userId];
    if (!factionToStarters[fk]) factionToStarters[fk] = [];
    factionToStarters[fk].push(pid);
  }

  const alignmentRows = [];
  for (const f of Object.keys(factionToStarters)) {
    const anyWon = factionToStarters[f].some((pid) => winnerIds.has(pid));
    alignmentRows.push([f, gameTypeTag(game), anyWon]);
  }

  const roleRows = [];
  for (const pid of Object.keys(originalRoles)) {
    const roleKey = originalRoles[pid];
    const won = winnerIds.has(pid);
    roleRows.push([roleKey, gameTypeTag(game), won]);
  }

  const lengthMs = Math.max(
    0,
    (game.endTime || Date.now()) - (game.startTime || game.endTime || Date.now())
  );
  const gt = gameTypeTag(game);

  const svId = await resolveSetupVersionId(game.setup, game.endTime);
  if (!svId) return { skipped: "noSetupVersion" };

  await models.SetupVersion.updateOne(
    { _id: svId },
    {
      $push: {
        "setupStats.alignmentRows": { $each: alignmentRows },
        "setupStats.roleRows": { $each: roleRows },
        "setupStats.gameLengthRows": { $each: [[gt, lengthMs]] },
      },
    }
  ).exec();

  await models.Game.updateOne(
    { _id: game._id },
    { $set: { setupStatsBackfilled: true } }
  ).exec();

  return { ok: true, skipped: null };
}

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const limit =
    limitArg >= 0 && process.argv[limitArg + 1]
      ? parseInt(process.argv[limitArg + 1], 10)
      : 0;

  await mongoose.connect(
    process.env.MONGO_URL || "mongodb://localhost:27017/ultimafia",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );

  logger.info("Connected. Scanning games…");

  const query = {
    endTime: { $gt: 0 },
    type: "Mafia",
    setup: { $exists: true, $ne: null },
    $and: [
      {
        $or: [
          { setupStatsBackfilled: false },
          { setupStatsBackfilled: { $exists: false } },
        ],
      },
      {
        $or: [{ left: [] }, { left: { $exists: false } }],
      },
    ],
    hadVeg: { $ne: true },
  };

  let cursor = models.Game.find(query)
    .sort({ endTime: 1 })
    .cursor();

  let n = 0;
  let ok = 0;
  let skipped = 0;

  for await (const game of cursor) {
    if (limit && n >= limit) break;
    n++;
    try {
      const r = await processGame(game);
      if (r.ok) ok++;
      else skipped++;
    } catch (e) {
      logger.error(`Game ${game.id}:`, e);
    }
  }

  logger.info(
    `Processed ${n} games (${ok} backfilled, ${skipped} skipped or failed rules).`
  );
  process.exit(0);
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});
