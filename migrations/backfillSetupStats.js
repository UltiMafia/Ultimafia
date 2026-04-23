/**
 * Rebuild SetupVersion.setupStats (alignmentRows, roleRows, gameLengthRows) from Game documents.
 *
 * Usage:
 *   # Smoke-test on one setup first
 *   node migrations/backfillSetupStats.js --setup 9YVD1N1qC
 *
 *   # Cap the SV count for a partial run
 *   node migrations/backfillSetupStats.js --explicit-all --limit 100
 *
 *   # Full rebuild
 *   node migrations/backfillSetupStats.js --explicit-all
 *
 * Requires either --setup or --explicit-all so a full-DB rebuild can never
 * be triggered by accident. Requires MONGO_URL (or default localhost) and
 * optional dotenv.
 *
 * Iterates every SetupVersion in scope and rebuilds its row arrays from
 * the games that belong to that version's time window, using $set (not
 * $push). Safe to re-run: the same inputs produce the same arrays. Covers
 * setups left in a partial state by earlier runs, since no game is
 * permanently excluded by a stale setupStatsBackfilled flag.
 *
 * Skips games with leavers, hadVeg, or missing history (playerIdMap /
 * originalRoles). Games missing history are NOT marked as backfilled —
 * we want them to remain eligible if a future extraction path handles them.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const mongo = require("mongodb");
const models = require("../db/models");
let logger;
try {
  logger = require("../modules/logging")("backfillSetupStats");
} catch (e) {
  const reason =
    e && (e.code === "EACCES" || e.code === "EPERM" || e.code === "ENOENT");
  if (reason) {
    const toText = (msg, args) =>
      [msg, ...args]
        .map((v) => {
          if (v instanceof Error) return v.stack || v.message;
          if (typeof v === "string") return v;
          try {
            return JSON.stringify(v);
          } catch {
            return String(v);
          }
        })
        .join(" ");

    // Keep migration runnable in restricted environments where logs dir cannot be created.
    logger = {
      info: (msg, ...args) => console.log(toText(msg, args)),
      warn: (msg, ...args) => console.warn(toText(msg, args)),
      error: (msg, ...args) => console.error(toText(msg, args)),
      http: (msg, ...args) => console.log(toText(msg, args)),
    };
    logger.warn(
      "File logging unavailable; using console logger fallback.",
      e.message || e
    );
  } else {
    throw e;
  }
}

const ObjectID = mongo.ObjectID;

function parseJson(s, fallback) {
  if (!s || typeof s !== "string") return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function mongoConnectOptions() {
  const rawUrl = (process.env.MONGO_URL || "").trim();
  const hasScheme = /^mongodb(\+srv)?:\/\//i.test(rawUrl);

  if (hasScheme) {
    return {
      uri: rawUrl,
      options: {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PW,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    };
  }

  const host = rawUrl || "localhost:27017";
  const dbName = process.env.MONGO_DB || "ultimafia";

  return {
    uri: `mongodb://${host}/${dbName}?authSource=admin`,
    options: {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PW,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  };
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

// Pure: returns rows or null. Null means "don't contribute AND don't mark
// backfilled" — a later run with better extraction can still try this game.
function computeRowsForGame(game) {
  if ((game.left || []).length > 0) return null;
  if (game.hadVeg === true) return null;
  if (game.type !== "Mafia") return null;

  const playerIdMap = parseJson(game.playerIdMap, {});
  const playerAlignmentMap = parseJson(game.playerAlignmentMap, {});
  const history = parseJson(game.history, {});
  const originalRoles = history.originalRoles || {};

  // Without originalRoles/playerIdMap we cannot derive alignments or roles.
  // Previously this case silently wrote empty rows and marked the game
  // processed, permanently excluding it from future retries.
  if (
    Object.keys(originalRoles).length === 0 ||
    Object.keys(playerIdMap).length === 0
  ) {
    return null;
  }

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

  if (Object.keys(factionToStarters).length === 0) return null;

  const gt = gameTypeTag(game);

  const alignmentRows = [];
  for (const f of Object.keys(factionToStarters)) {
    const anyWon = factionToStarters[f].some((pid) => winnerIds.has(pid));
    alignmentRows.push([f, gt, anyWon]);
  }

  const roleRows = [];
  for (const pid of Object.keys(originalRoles)) {
    roleRows.push([originalRoles[pid], gt, winnerIds.has(pid)]);
  }

  const lengthMs = Math.max(
    0,
    (game.endTime || Date.now()) -
      (game.startTime || game.endTime || Date.now())
  );

  return {
    alignmentRows,
    roleRows,
    gameLengthRow: [gt, lengthMs],
  };
}

// A SetupVersion's window is [its timestamp, next version's timestamp).
// Mirrors "latest version whose timestamp <= game.endTime".
async function setupVersionWindow(sv) {
  const nextSv = await models.SetupVersion.findOne({
    setup: sv.setup,
    version: { $gt: sv.version },
  })
    .sort({ version: 1 })
    .select("timestamp")
    .lean();

  const start = sv.timestamp ? new Date(sv.timestamp).getTime() : 0;
  const end =
    nextSv && nextSv.timestamp
      ? new Date(nextSv.timestamp).getTime()
      : Number.MAX_SAFE_INTEGER;
  return { start, end };
}

async function rebuildSetupVersion(sv) {
  const { start, end } = await setupVersionWindow(sv);

  const query = {
    setup: sv.setup,
    type: "Mafia",
    endTime: { $gte: start, $lt: end },
    $or: [{ left: [] }, { left: { $exists: false } }],
    hadVeg: { $ne: true },
  };

  const cursor = models.Game.find(query).lean().cursor();

  const alignmentRows = [];
  const roleRows = [];
  const gameLengthRows = [];
  const contributingIds = [];
  let seen = 0;

  for await (const game of cursor) {
    seen++;
    const rows = computeRowsForGame(game);
    if (!rows) continue;
    alignmentRows.push(...rows.alignmentRows);
    roleRows.push(...rows.roleRows);
    gameLengthRows.push(rows.gameLengthRow);
    contributingIds.push(game._id);
  }

  // Writes specific subfields only — leaves setupStats.totalVegs and any
  // future fields alone. Always writes, so an SV that no longer has
  // qualifying games gets cleared rather than carrying stale rows.
  await models.SetupVersion.updateOne(
    { _id: sv._id },
    {
      $set: {
        "setupStats.alignmentRows": alignmentRows,
        "setupStats.roleRows": roleRows,
        "setupStats.gameLengthRows": gameLengthRows,
      },
    }
  );

  if (contributingIds.length) {
    await models.Game.updateMany(
      { _id: { $in: contributingIds } },
      { $set: { setupStatsBackfilled: true } }
    );
  }

  return {
    seen,
    contributed: contributingIds.length,
    skipped: seen - contributingIds.length,
  };
}

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const limit =
    limitArg >= 0 && process.argv[limitArg + 1]
      ? parseInt(process.argv[limitArg + 1], 10)
      : 0;

  const setupArg = process.argv.indexOf("--setup");
  const setupPublicId =
    setupArg >= 0 && process.argv[setupArg + 1]
      ? process.argv[setupArg + 1]
      : null;

  const explicitAll = process.argv.includes("--explicit-all");

  if (!setupPublicId && !explicitAll) {
    console.error(
      "Refusing to run: pass --setup <publicId> for one setup, or --explicit-all to process every setup."
    );
    process.exit(1);
  }

  const { uri, options } = mongoConnectOptions();
  await mongoose.connect(uri, options);

  let svQuery = {};
  if (setupPublicId) {
    const setupDoc = await models.Setup.findOne({ id: setupPublicId })
      .select("_id")
      .lean();
    if (!setupDoc) {
      logger.error(`Setup not found: ${setupPublicId}`);
      process.exit(1);
    }
    svQuery = { setup: setupDoc._id };
    logger.info(
      `Connected. Rebuilding setupStats for setup ${setupPublicId} (${setupDoc._id})…`
    );
  } else {
    logger.info("Connected. Rebuilding setupStats for every SetupVersion…");
  }

  const svCursor = models.SetupVersion.find(svQuery)
    .select("_id setup version timestamp")
    .cursor();

  let svCount = 0;
  let totalSeen = 0;
  let totalContributed = 0;
  let totalSkipped = 0;

  for await (const sv of svCursor) {
    if (limit && svCount >= limit) break;
    svCount++;

    try {
      const r = await rebuildSetupVersion(sv);
      totalSeen += r.seen;
      totalContributed += r.contributed;
      totalSkipped += r.skipped;

      if (svCount % 50 === 0) {
        logger.info(
          `Processed ${svCount} SetupVersions (${totalContributed} games contributed, ${totalSkipped} skipped)`
        );
      }
    } catch (e) {
      logger.error(`SetupVersion ${sv._id}:`, e);
    }
  }

  logger.info(
    `Done. ${svCount} SetupVersions processed; ${totalSeen} games seen, ${totalContributed} contributed rows, ${totalSkipped} skipped.`
  );
  process.exit(0);
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});
