/**
 * Recompute setup stats for Setup id "g9eG8Nziv" using each player's FINAL
 * role at game end (read from history state -2), instead of the starting
 * role. Targets the bug where conversion-heavy setups credited the
 * starting alignment with wins it never earned (e.g. 100% Village win
 * rate when Village got mass-converted to Cult).
 *
 * REPLACES (not increments) alignmentRows, roleRows, rolePlays, roleWins,
 * alignmentPlays, alignmentWins. Leaves played, gameLengthRows and
 * setupStats.totalVegs alone — those don't depend on role attribution.
 * Logs a warning if the recomputed play count diverges from the existing
 * `played` counter (e.g. games with missing history are dropped).
 *
 * Run inside the backend container:
 *   docker exec backend node migrations/recomputeSetupStats_g9eG8Nziv.js [--dry]
 */

require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");
const roleData = require("../data/roles");

const TARGET_SETUP_ID = "g9eG8Nziv";

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

function parseJson(s, fallback) {
  if (!s || typeof s !== "string") return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function getRoleAlignment(roleName) {
  const entry = roleData.Mafia && roleData.Mafia[roleName];
  return entry ? entry.alignment : null;
}

// Find the latest state's `roles` map. After `recordAllRoles` runs in
// endGame (state -2 is Postgame), this map contains real final roles
// keyed by playerId, in the form "RoleName:modifier" or "RoleName".
function getFinalRolesFromHistory(history) {
  if (!history || typeof history !== "object") return {};
  const stateNums = Object.keys(history)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  if (!stateNums.length) return {};
  // Prefer Postgame (-2) if present; otherwise fall back to the highest
  // numbered in-game state.
  let chosen;
  if (stateNums.includes(-2)) {
    chosen = -2;
  } else {
    chosen = Math.max(...stateNums.filter((n) => n >= 0));
    if (!Number.isFinite(chosen)) return {};
  }
  return (history[chosen] && history[chosen].roles) || {};
}

function splitRoleString(s) {
  if (!s || typeof s !== "string") return { roleName: null, modifier: null };
  const [roleName, rawMod] = s.split(":");
  const modifier =
    rawMod && rawMod !== "undefined" && rawMod !== "null" ? rawMod : null;
  return { roleName, modifier };
}

function processGame(game) {
  if (game.type !== "Mafia") return { skipped: "notMafia" };
  if (game.hadVeg === true) return { skipped: "veg" };
  if (Array.isArray(game.left) && game.left.length > 0)
    return { skipped: "leaver" };

  const history = parseJson(game.history, {});
  const finalRolesById = getFinalRolesFromHistory(history);
  if (!finalRolesById || !Object.keys(finalRolesById).length) {
    return { skipped: "noFinalRoles" };
  }

  const winnerIds = new Set();
  if (Array.isArray(game.winners)) {
    game.winners.forEach((id) => winnerIds.add(id));
  }
  if (game.winnersInfo && Array.isArray(game.winnersInfo.players)) {
    game.winnersInfo.players.forEach((id) => winnerIds.add(id));
  }

  const finalRoleByPlayer = {};
  for (const playerId of Object.keys(finalRolesById)) {
    const { roleName, modifier } = splitRoleString(finalRolesById[playerId]);
    if (!roleName) continue;
    const alignment = getRoleAlignment(roleName);
    if (!alignment) continue;
    finalRoleByPlayer[playerId] = { roleName, modifier, alignment };
  }
  if (!Object.keys(finalRoleByPlayer).length) {
    return { skipped: "noResolvableRoles" };
  }

  const tag = gameTypeTag(game);

  const factionToPlayers = {};
  for (const playerId of Object.keys(finalRoleByPlayer)) {
    const { roleName, alignment } = finalRoleByPlayer[playerId];
    const alignmentIsFaction =
      alignment === "Village" ||
      alignment === "Mafia" ||
      alignment === "Cult";
    let factionName = alignmentIsFaction ? alignment : roleName;
    if (factionName === "Traitor") factionName = "Mafia";
    if (!factionToPlayers[factionName]) factionToPlayers[factionName] = [];
    factionToPlayers[factionName].push(playerId);
  }

  const alignmentRows = [];
  for (const f of Object.keys(factionToPlayers)) {
    const anyWon = factionToPlayers[f].some((pid) => winnerIds.has(pid));
    alignmentRows.push([f, tag, anyWon]);
  }

  const roleRows = [];
  for (const playerId of Object.keys(finalRoleByPlayer)) {
    const { roleName, modifier } = finalRoleByPlayer[playerId];
    const roleKey = modifier ? `${roleName}:${modifier}` : roleName;
    const won = winnerIds.has(playerId);
    roleRows.push([roleKey, tag, won]);
  }

  const rolePlays = {};
  const alignmentPlays = {};
  const roleWins = {};
  const alignmentWins = {};
  for (const playerId of Object.keys(finalRoleByPlayer)) {
    const { roleName, alignment } = finalRoleByPlayer[playerId];
    rolePlays[roleName] = (rolePlays[roleName] || 0) + 1;
    alignmentPlays[alignment] = (alignmentPlays[alignment] || 0) + 1;
    if (winnerIds.has(playerId)) {
      roleWins[roleName] = (roleWins[roleName] || 0) + 1;
      alignmentWins[alignment] = (alignmentWins[alignment] || 0) + 1;
    }
  }

  return {
    ok: true,
    alignmentRows,
    roleRows,
    rolePlays,
    roleWins,
    alignmentPlays,
    alignmentWins,
  };
}

function mergeMap(into, from) {
  for (const k of Object.keys(from)) {
    into[k] = (into[k] || 0) + from[k];
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry");

  const { uri, options } = mongoConnectOptions();
  await mongoose.connect(uri, options);
  console.log(`Connected. Recomputing stats for setup id=${TARGET_SETUP_ID}`);

  const setup = await models.Setup.findOne({ id: TARGET_SETUP_ID });
  if (!setup) {
    console.error(`Setup ${TARGET_SETUP_ID} not found.`);
    process.exit(1);
  }

  const setupVersions = await models.SetupVersion.find({ setup: setup._id })
    .select("_id version")
    .lean();
  if (!setupVersions.length) {
    console.error(`No SetupVersion docs for setup ${TARGET_SETUP_ID}.`);
    process.exit(1);
  }
  console.log(
    `Found ${setupVersions.length} SetupVersion(s): ${setupVersions
      .map((sv) => `v${sv.version}`)
      .join(", ")}`
  );

  // Recompute per SetupVersion. Games are bucketed to the version they
  // were played on (Game.setupVersion). Older games predate the
  // setupVersion field; route those (null) to v0.
  for (const sv of setupVersions) {
    const versionFilter =
      sv.version === 0
        ? { $in: [0, null] }
        : sv.version;
    const games = await models.Game.find({
      setup: setup._id,
      setupVersion: versionFilter,
      endTime: { $gt: 0 },
      type: "Mafia",
    }).lean();

    let agg = {
      alignmentRows: [],
      roleRows: [],
      rolePlays: {},
      roleWins: {},
      alignmentPlays: {},
      alignmentWins: {},
      played: 0,
    };
    let processed = 0;
    let skipped = { veg: 0, leaver: 0, notMafia: 0, noFinalRoles: 0, noResolvableRoles: 0 };

    for (const game of games) {
      const r = processGame(game);
      if (!r.ok) {
        skipped[r.skipped] = (skipped[r.skipped] || 0) + 1;
        continue;
      }
      processed++;
      agg.alignmentRows.push(...r.alignmentRows);
      agg.roleRows.push(...r.roleRows);
      mergeMap(agg.rolePlays, r.rolePlays);
      mergeMap(agg.roleWins, r.roleWins);
      mergeMap(agg.alignmentPlays, r.alignmentPlays);
      mergeMap(agg.alignmentWins, r.alignmentWins);
      agg.played++;
    }

    console.log(
      `\nSetupVersion v${sv.version}: ${games.length} games, ${processed} contributed, skipped=${JSON.stringify(skipped)}`
    );
    console.log(
      `  alignmentPlays: ${JSON.stringify(agg.alignmentPlays)}\n` +
        `  alignmentWins:  ${JSON.stringify(agg.alignmentWins)}\n` +
        `  rolePlays:      ${JSON.stringify(agg.rolePlays)}\n` +
        `  roleWins:       ${JSON.stringify(agg.roleWins)}\n` +
        `  played:         ${agg.played}`
    );

    const existing = await models.SetupVersion.findById(sv._id)
      .select("played")
      .lean();
    if (existing && existing.played != null && existing.played !== agg.played) {
      console.warn(
        `  WARN: existing played=${existing.played} differs from recomputed=${agg.played} ` +
          `(games dropped due to missing/corrupt history). played counter NOT touched.`
      );
    }

    if (dryRun) {
      console.log("  [dry] skipping write.");
      continue;
    }

    await models.SetupVersion.updateOne(
      { _id: sv._id },
      {
        $set: {
          rolePlays: agg.rolePlays,
          roleWins: agg.roleWins,
          alignmentPlays: agg.alignmentPlays,
          alignmentWins: agg.alignmentWins,
          "setupStats.alignmentRows": agg.alignmentRows,
          "setupStats.roleRows": agg.roleRows,
        },
      }
    ).exec();
    console.log("  written.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
