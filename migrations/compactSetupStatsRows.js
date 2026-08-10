/**
 * Compact legacy SetupVersion.setupStats.*Rows into fixed-size aggregates
 * and drop the unbounded row arrays.
 *
 * Why: competitive (and ranked) games $push'ed one row per faction/role per
 * finished game. Popular competitive setups grew multi-MB setupStats docs;
 * every game end loaded the full array for fortune calculation, causing
 * process memory to climb with competitive play.
 *
 * Usage (from repo root, with MONGO_URL / env loaded like other migrations):
 *   node migrations/compactSetupStatsRows.js
 *   node migrations/compactSetupStatsRows.js --dry-run
 *   node migrations/compactSetupStatsRows.js --min-rows 100
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const models = require("../db/models");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const minRowsIdx = args.indexOf("--min-rows");
const minRows =
  minRowsIdx >= 0 && args[minRowsIdx + 1]
    ? parseInt(args[minRowsIdx + 1], 10)
    : 1;

function sanitizeKey(key) {
  return String(key == null ? "" : key).replace(/[.$]/g, "_");
}

function foldWinRows(rows, into) {
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const [rawKey, gameType, won] = row;
    if (!rawKey || !gameType) continue;
    const key = sanitizeKey(rawKey);
    if (!into[key]) into[key] = {};
    if (!into[key][gameType]) into[key][gameType] = { wins: 0, games: 0 };
    into[key][gameType].games += 1;
    if (won === true) into[key][gameType].wins += 1;
  }
}

function foldLengthRows(rows, into) {
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const [gameType, lengthMs] = row;
    if (!gameType) continue;
    if (!into[gameType]) into[gameType] = { sumMs: 0, count: 0 };
    into[gameType].sumMs += Number(lengthMs) || 0;
    into[gameType].count += 1;
  }
}

function mergeAgg(existing, folded) {
  // Sum row history with any post-deploy aggregate increments.
  // After the fix ships, new games only touch *Agg; legacy *Rows hold history
  // until this migration. Summing recovers both without losing either window.
  const out = {};
  for (const src of [existing, folded]) {
    if (!src || typeof src !== "object") continue;
    for (const [key, byType] of Object.entries(src)) {
      if (!byType || typeof byType !== "object") continue;
      if (!out[key]) out[key] = {};
      for (const [gameType, stats] of Object.entries(byType)) {
        if (!stats || typeof stats !== "object") continue;
        if (!out[key][gameType]) out[key][gameType] = { wins: 0, games: 0 };
        out[key][gameType].wins += Number(stats.wins) || 0;
        out[key][gameType].games += Number(stats.games) || 0;
      }
    }
  }
  return out;
}

function mergeLength(existing, folded) {
  const out = {};
  for (const src of [existing, folded]) {
    if (!src || typeof src !== "object") continue;
    for (const [gameType, stats] of Object.entries(src)) {
      if (!stats || typeof stats !== "object") continue;
      if (!out[gameType]) out[gameType] = { sumMs: 0, count: 0 };
      out[gameType].sumMs += Number(stats.sumMs) || 0;
      out[gameType].count += Number(stats.count) || 0;
    }
  }
  return out;
}

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL / MONGODB_URI not set");
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log(
    `[compactSetupStatsRows] connected (dryRun=${dryRun}, minRows=${minRows})`
  );

  const cursor = models.SetupVersion.find({
    $or: [
      { "setupStats.alignmentRows.0": { $exists: true } },
      { "setupStats.roleRows.0": { $exists: true } },
      { "setupStats.gameLengthRows.0": { $exists: true } },
    ],
  })
    .select("_id setupStats")
    .cursor();

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let maxRows = 0;

  for await (const doc of cursor) {
    scanned++;
    const ss = doc.setupStats || {};
    const aLen = Array.isArray(ss.alignmentRows) ? ss.alignmentRows.length : 0;
    const rLen = Array.isArray(ss.roleRows) ? ss.roleRows.length : 0;
    const lLen = Array.isArray(ss.gameLengthRows) ? ss.gameLengthRows.length : 0;
    const totalRows = aLen + rLen + lLen;
    if (totalRows > maxRows) maxRows = totalRows;
    if (totalRows < minRows) {
      skipped++;
      continue;
    }

    const alignmentFolded = {};
    const roleFolded = {};
    const lengthFolded = {};
    foldWinRows(ss.alignmentRows, alignmentFolded);
    foldWinRows(ss.roleRows, roleFolded);
    foldLengthRows(ss.gameLengthRows, lengthFolded);

    const alignmentAgg = mergeAgg(ss.alignmentAgg, alignmentFolded);
    const roleAgg = mergeAgg(ss.roleAgg, roleFolded);
    const lengthAgg = mergeLength(ss.lengthAgg, lengthFolded);

    console.log(
      `  SetupVersion ${doc._id}: rows a=${aLen} r=${rLen} l=${lLen} -> agg factions=${Object.keys(alignmentAgg).length} roles=${Object.keys(roleAgg).length}`
    );

    if (!dryRun) {
      await models.SetupVersion.updateOne(
        { _id: doc._id },
        {
          $set: {
            "setupStats.alignmentAgg": alignmentAgg,
            "setupStats.roleAgg": roleAgg,
            "setupStats.lengthAgg": lengthAgg,
            "setupStats.alignmentRows": [],
            "setupStats.roleRows": [],
            "setupStats.gameLengthRows": [],
          },
        }
      ).exec();
    }
    updated++;
  }

  console.log(
    `[compactSetupStatsRows] done scanned=${scanned} updated=${updated} skipped=${skipped} maxRowsSeen=${maxRows} dryRun=${dryRun}`
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
