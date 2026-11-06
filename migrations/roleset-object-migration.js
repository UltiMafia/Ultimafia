require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const { canonicalizeRoles, hashSetup } = require("../lib/roleset");

/**
 * Migration: store setup roles as slot records instead of a JSON string.
 *
 * Each roleset becomes an array of { name, modifiers, items, count }.
 * `items` is always [] here. Starting inventory can fill it later.
 * The role key players already see ("Villager:Armed") is still derived
 * from name + modifiers, so existing games read the same roles.
 *
 * Ship a server that understands both shapes before running this.
 * Readers accept the old string and the new records, so a dry run is safe
 * on the current build. Writing records requires that build to be live.
 *
 * How to run
 * ----------
 *   DRY_RUN=true node migrations/roleset-object-migration.js
 *   node migrations/roleset-object-migration.js
 *
 * Uses MONGO_URL, MONGO_DB, MONGO_USER, MONGO_PW (see db/db.js).
 */

const DRY_RUN = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";

function mongoConnectOptions() {
  const host = process.env.MONGO_URL || "localhost:27017";
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

function plainSetup(doc) {
  const plain = doc.toObject();
  if (plain.count instanceof Map) {
    plain.count = Object.fromEntries(plain.count);
  }
  return plain;
}

function alreadyRecords(roles) {
  return Array.isArray(roles) && (roles.length === 0 || Array.isArray(roles[0]));
}

async function migrate() {
  try {
    const { uri, options } = mongoConnectOptions();
    await mongoose.connect(uri, options);

    logger.info("Connected to database");
    if (DRY_RUN) logger.info("DRY RUN – no changes will be written");

    const setups = await models.Setup.find({});
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const hashes = new Map();

    for (const setup of setups) {
      if (alreadyRecords(setup.roles)) {
        skipped++;
        continue;
      }

      let roles;
      let hash;
      try {
        const plain = plainSetup(setup);
        roles = canonicalizeRoles(plain.roles, plain.gameType);
        hash = hashSetup({ ...plain, roles });
      } catch (e) {
        failed++;
        logger.error(`Setup ${setup.id} (${setup.name || "unnamed"}) failed: ${e.message}`);
        continue;
      }

      const prior = hashes.get(hash);
      if (prior) {
        logger.warn(
          `Setup ${setup.id} (${setup.name || "unnamed"}) hashes the same as ${prior}. Both are kept.`
        );
      }
      hashes.set(hash, setup.id);

      logger.info(`Setup ${setup.id} (${setup.name || "unnamed"})`);

      if (!DRY_RUN) {
        await models.Setup.updateOne(
          { id: setup.id },
          { $set: { roles, hash } }
        );
      }
      updated++;
    }

    logger.info(
      DRY_RUN
        ? `Would update ${updated} setup(s), skip ${skipped} already converted, ${failed} failed.`
        : `Updated ${updated} setup(s), skipped ${skipped} already converted, ${failed} failed.`
    );
    process.exit(failed ? 1 : 0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
