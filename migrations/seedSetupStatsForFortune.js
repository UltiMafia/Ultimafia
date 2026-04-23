/**
 * Seed SetupVersion.setupStats.alignmentRows and .roleRows for a single setup
 * with synthetic rows that reproduce a target set of winrates.
 *
 * Used when the games collection cannot be replayed (e.g. cold data lost the
 * playerIdMap / history.originalRoles) but we still want fortunePoints and the
 * granular bar chart to read a sensible winrate. Rows are written as
 * --game-type (default "ranked") so they count for fortune payouts, which
 * ignore "unranked".
 *
 * Usage:
 *   node migrations/seedSetupStatsForFortune.js --setup XTI58MfKl
 *   node migrations/seedSetupStatsForFortune.js --setup XTI58MfKl --game-type competitive
 *   node migrations/seedSetupStatsForFortune.js --setup XTI58MfKl --dry-run
 *
 * Overwrites alignmentRows and roleRows on the current SetupVersion. Leaves
 * gameLengthRows, totalVegs, and every legacy field alone.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const mongo = require("mongodb");
const models = require("../db/models");
const logger = require("../modules/logging")("seedSetupStatsForFortune");

const ObjectID = mongo.ObjectID;

// Target numbers approved for setup XTI58MfKl. Each entry is { key, plays,
// wins } — winrate = wins / plays. Factions not listed here are left out of
// alignmentRows, which means fortunePoints will fall back to its defaults
// (DEFAULT_MAJOR_WR for majors, DEFAULT_INDEPENDENT_WR for independents).
const ALIGNMENT_SEED = [
  { key: "Village", plays: 155, wins: 57 }, // 36.8%
  { key: "Mafia", plays: 124, wins: 80 }, //    64.5%
  { key: "Magus", plays: 31, wins: 26 }, //     83.9%
  { key: "Dodo", plays: 44, wins: 12 }, //      27.3%
];

const ROLE_SEED = [
  { key: "Cop", plays: 155, wins: 57 }, //       36.8%
  { key: "Villager", plays: 465, wins: 171 }, // 36.8%
  { key: "Miller", plays: 31, wins: 26 }, //     83.9%
  { key: "Gunsmith", plays: 70, wins: 35 }, //   50.0%
  { key: "Hunter", plays: 41, wins: 14 }, //     34.1%
  { key: "Mafioso", plays: 124, wins: 80 }, //   64.5%
  { key: "Hooker", plays: 83, wins: 53 }, //     63.9%
  { key: "Gunrunner", plays: 41, wins: 27 }, //  65.9%
  { key: "Magus", plays: 31, wins: 26 }, //      83.9%
  { key: "Dodo", plays: 44, wins: 12 }, //       27.3%
];

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

function buildRows(seed, gameType) {
  const rows = [];
  for (const entry of seed) {
    const losses = entry.plays - entry.wins;
    if (losses < 0) {
      throw new Error(
        `Invalid seed for "${entry.key}": wins (${entry.wins}) > plays (${entry.plays})`
      );
    }
    for (let i = 0; i < entry.wins; i++) rows.push([entry.key, gameType, true]);
    for (let i = 0; i < losses; i++) rows.push([entry.key, gameType, false]);
  }
  return rows;
}

function summarize(seed) {
  return seed
    .map((e) => {
      const wr = e.plays ? ((e.wins / e.plays) * 100).toFixed(1) : "0.0";
      return `  ${e.key.padEnd(10)} ${String(e.wins).padStart(3)}/${String(e.plays).padEnd(3)} = ${wr}%`;
    })
    .join("\n");
}

async function main() {
  const setupArg = process.argv.indexOf("--setup");
  const setupPublicId =
    setupArg >= 0 && process.argv[setupArg + 1]
      ? process.argv[setupArg + 1]
      : null;

  const gameTypeArg = process.argv.indexOf("--game-type");
  const gameType =
    gameTypeArg >= 0 && process.argv[gameTypeArg + 1]
      ? process.argv[gameTypeArg + 1]
      : "ranked";

  const dryRun = process.argv.includes("--dry-run");

  if (!setupPublicId) {
    console.error("Usage: --setup <publicId> [--game-type ranked|competitive] [--dry-run]");
    process.exit(1);
  }
  if (!["ranked", "competitive"].includes(gameType)) {
    console.error(
      `Refusing gameType="${gameType}" — fortunePoints only counts "ranked" or "competitive".`
    );
    process.exit(1);
  }

  const alignmentRows = buildRows(ALIGNMENT_SEED, gameType);
  const roleRows = buildRows(ROLE_SEED, gameType);

  logger.info(`Alignment winrates to seed (as ${gameType}):\n${summarize(ALIGNMENT_SEED)}`);
  logger.info(`Role winrates to seed (as ${gameType}):\n${summarize(ROLE_SEED)}`);
  logger.info(
    `Will write ${alignmentRows.length} alignmentRows and ${roleRows.length} roleRows.`
  );

  const { uri, options } = mongoConnectOptions();
  await mongoose.connect(uri, options);

  const setupDoc = await models.Setup.findOne({ id: setupPublicId })
    .select("_id version")
    .lean();
  if (!setupDoc) {
    logger.error(`Setup not found: ${setupPublicId}`);
    process.exit(1);
  }

  const versionNum = setupDoc.version || 0;
  const sv = await models.SetupVersion.findOne({
    setup: new ObjectID(setupDoc._id),
    version: versionNum,
  })
    .select("_id version")
    .lean();
  if (!sv) {
    logger.error(
      `SetupVersion not found for setup ${setupPublicId} version ${versionNum}.`
    );
    process.exit(1);
  }

  logger.info(
    `Target: setup ${setupPublicId} (${setupDoc._id}) SetupVersion ${sv._id} v${sv.version}`
  );

  if (dryRun) {
    logger.info("--dry-run set; no write performed.");
    process.exit(0);
  }

  const res = await models.SetupVersion.updateOne(
    { _id: sv._id },
    {
      $set: {
        "setupStats.alignmentRows": alignmentRows,
        "setupStats.roleRows": roleRows,
      },
    }
  );

  logger.info(
    `Write complete. matched=${res.matchedCount} modified=${res.modifiedCount}`
  );
  process.exit(0);
}

main().catch((e) => {
  logger.error(e.stack || e.message || e);
  process.exit(1);
});
