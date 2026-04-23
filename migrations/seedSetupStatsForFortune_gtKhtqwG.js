/**
 * Seed SetupVersion.setupStats.alignmentRows and .roleRows for setup
 * "gtKh-tqwG" with approved winrate targets.
 *
 * Shape parity with seedSetupStatsForFortune.js: rows are written as
 * --game-type (default "ranked") so fortunePoints counts them.
 *
 * Setup composition is 2 Templar + 3 Villager + 2 Mafioso per game over
 * 26 games with 11 Village wins and 15 Mafia wins (sums to 26, no joint
 * wins). Role seed derives plays/wins from that composition.
 *
 * Usage:
 *   node migrations/seedSetupStatsForFortune_gtKhtqwG.js
 *   node migrations/seedSetupStatsForFortune_gtKhtqwG.js --game-type competitive
 *   node migrations/seedSetupStatsForFortune_gtKhtqwG.js --dry-run
 *
 * Overwrites alignmentRows and roleRows on the current SetupVersion.
 * Leaves gameLengthRows, totalVegs, and every legacy field alone.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const mongo = require("mongodb");
const models = require("../db/models");
const logger = require("../modules/logging")("seedSetupStatsForFortune");

const ObjectID = mongo.ObjectID;

const SETUP_PUBLIC_ID = "gtKh-tqwG";

// 26 total games, 11 Village wins (42.3%), 15 Mafia wins (57.7%).
const ALIGNMENT_SEED = [
  { key: "Village", plays: 26, wins: 11 }, // 42.3%
  { key: "Mafia", plays: 26, wins: 15 }, //   57.7%
];

// 2 Templar + 3 Villager (Village) + 2 Mafioso (Mafia) per game × 26 games.
// Village roles share all 11 Village wins; Mafia roles share all 15 Mafia wins.
const ROLE_SEED = [
  { key: "Templar", plays: 52, wins: 22 }, //  42.3% (26×2 plays, 11×2 wins)
  { key: "Villager", plays: 78, wins: 33 }, // 42.3% (26×3 plays, 11×3 wins)
  { key: "Mafioso", plays: 52, wins: 30 }, //  57.7% (26×2 plays, 15×2 wins)
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

function buildRowsFromSeed(seed, gameType) {
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
      return `  ${e.key.padEnd(12)} ${String(e.wins).padStart(4)}/${String(e.plays).padEnd(4)} = ${wr}%`;
    })
    .join("\n");
}

async function main() {
  const gameTypeArg = process.argv.indexOf("--game-type");
  const gameType =
    gameTypeArg >= 0 && process.argv[gameTypeArg + 1]
      ? process.argv[gameTypeArg + 1]
      : "ranked";
  const dryRun = process.argv.includes("--dry-run");

  if (!["ranked", "competitive"].includes(gameType)) {
    console.error(
      `Refusing gameType="${gameType}" — fortunePoints only counts "ranked" or "competitive".`
    );
    process.exit(1);
  }

  const alignmentRows = buildRowsFromSeed(ALIGNMENT_SEED, gameType);
  const roleRows = buildRowsFromSeed(ROLE_SEED, gameType);

  logger.info(
    `Alignment winrates to seed (as ${gameType}):\n${summarize(ALIGNMENT_SEED)}`
  );
  logger.info(
    `Role winrates to seed (as ${gameType}):\n${summarize(ROLE_SEED)}`
  );
  logger.info(
    `Will write ${alignmentRows.length} alignmentRows and ${roleRows.length} roleRows.`
  );

  const { uri, options } = mongoConnectOptions();
  await mongoose.connect(uri, options);

  const setupDoc = await models.Setup.findOne({ id: SETUP_PUBLIC_ID })
    .select("_id version")
    .lean();
  if (!setupDoc) {
    logger.error(`Setup not found: ${SETUP_PUBLIC_ID}`);
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
      `SetupVersion not found for setup ${SETUP_PUBLIC_ID} version ${versionNum}.`
    );
    process.exit(1);
  }

  logger.info(
    `Target: setup ${SETUP_PUBLIC_ID} (${setupDoc._id}) SetupVersion ${sv._id} v${sv.version}`
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
