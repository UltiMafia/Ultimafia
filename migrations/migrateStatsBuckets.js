/**
 * Migrate legacy user stats structure to bucketed format.
 *
 * Legacy: stats["Mafia"] = { all: {...}, bySetup: {...}, byRole: {...}, byAlignment: {...} }
 * New:    stats["Mafia"] = { all: { ...statsObj, bySetup, byRole, byAlignment }, unranked: { ... } }
 *
 * All legacy data is ranked+competitive, so top-level maps move into the `all` bucket.
 *
 * Run: node migrations/migrateStatsBuckets.js [--dry-run]
 * Requires .env with MONGO_URL / MONGO_DB / MONGO_USER / MONGO_PW.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");

const LEGACY_MAPS = ["bySetup", "byRole", "byAlignment"];

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

/**
 * Migrate a single user's stats object in place.
 * Returns true if any changes were made.
 */
function migrateUserStats(stats) {
  if (!stats) return false;
  let changed = false;

  for (const gameType of Object.keys(stats)) {
    const gameStats = stats[gameType];
    if (!gameStats || typeof gameStats !== "object") continue;

    if (!gameStats.all || typeof gameStats.all !== "object") continue;

    for (const mapName of LEGACY_MAPS) {
      const legacy = gameStats[mapName];
      if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) continue;
      if (Object.keys(legacy).length === 0) {
        delete gameStats[mapName];
        changed = true;
        continue;
      }

      if (!gameStats.all[mapName]) gameStats.all[mapName] = {};

      for (const key of Object.keys(legacy)) {
        if (!gameStats.all[mapName][key]) {
          gameStats.all[mapName][key] = legacy[key];
        }
      }

      delete gameStats[mapName];
      changed = true;
    }
  }

  return changed;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { uri, options } = mongoConnectOptions();
  await mongoose.connect(uri, options);

  console.log(`Connected.${dryRun ? " (dry run)" : ""} Scanning users…`);

  const cursor = models.User.find({
    stats: { $exists: true },
    $or: LEGACY_MAPS.map((m) => ({ [`stats.Mafia.${m}`]: { $exists: true } })),
  })
    .select("_id stats")
    .cursor();

  let scanned = 0;
  let migrated = 0;
  let failed = 0;

  for await (const user of cursor) {
    scanned++;
    try {
      const stats = user.stats;
      const changed = migrateUserStats(stats);
      if (!changed) continue;

      if (!dryRun) {
        await models.User.updateOne(
          { _id: user._id },
          { $set: { stats } }
        );
      }
      migrated++;
    } catch (e) {
      console.error(`Failed user ${user._id}: ${e.message}`);
      failed++;
    }
  }

  console.log(
    `Done. Scanned: ${scanned}, Migrated: ${migrated}, Failed: ${failed}.`
  );
  process.exit(0);
}

// Export for testing
module.exports = { migrateUserStats };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
