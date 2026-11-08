require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const { normalizeRoles, canonicalizeRoles, hashSetup } = require("../lib/roleset");

/**
 * Migration: replace a modifier in Mafia setups (edit OLD_MODIFIER / NEW_MODIFIER below).
 *
 * How to run
 * ----------
 * Uses the same MongoDB env vars as the app (see db/db.js):
 *   MONGO_URL  – host and port only, e.g. localhost:27017 or your Atlas/cluster host
 *   MONGO_DB   – database name, e.g. ultimafia
 *   MONGO_USER – MongoDB username (omit or leave empty only for local DBs with auth disabled)
 *   MONGO_PW   – MongoDB password
 *
 * Load env from your usual source (same as when you start the server), then:
 *
 *   # Preview changes only (no writes):
 *   DRY_RUN=true node migrations/modifier-migration.js
 *
 *   # Apply updates:
 *   node migrations/modifier-migration.js
 *
 * Example with inline env (production-style):
 *   MONGO_URL=your-host:27017 MONGO_DB=ultimafia MONGO_USER=... MONGO_PW=... node migrations/modifier-migration.js
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

const OLD_MODIFIER = "Scatterbrained";
const NEW_MODIFIER = "Humble";

function replaceModifierInRoles(rolesValue, gameType) {
  let anyChanged = false;
  const roles = normalizeRoles(rolesValue).map((roleset) =>
    roleset.map((slot) => {
      if (!slot.modifiers.includes(OLD_MODIFIER)) return slot;
      anyChanged = true;
      return {
        ...slot,
        modifiers: slot.modifiers.map((modifier) =>
          modifier === OLD_MODIFIER ? NEW_MODIFIER : modifier
        ),
      };
    })
  );
  return {
    newRoles: canonicalizeRoles(roles, gameType),
    changed: anyChanged,
  };
}

function computeHash(doc, roles) {
  const plain = doc.toObject();
  if (plain.count instanceof Map) plain.count = Object.fromEntries(plain.count);
  return hashSetup({ ...plain, roles });
}

async function migrate() {
  try {
    const { uri, options } = mongoConnectOptions();
    await mongoose.connect(uri, options);

    logger.info("Connected to database");
    if (DRY_RUN) logger.info("DRY RUN – no changes will be written");

    const setups = await models.Setup.find({ gameType: "Mafia" });
    let updated = 0;

    for (const setup of setups) {
      const { newRoles, changed } = replaceModifierInRoles(
        setup.roles,
        setup.gameType
      );

      if (!changed) continue;

      const newHash = computeHash(setup, newRoles);

      logger.info(
        `Setup ${setup.id} (${setup.name || "unnamed"}): replacing ${OLD_MODIFIER} with ${NEW_MODIFIER}`
      );

      if (!DRY_RUN) {
        await models.Setup.updateOne(
          { id: setup.id },
          { $set: { roles: newRoles, hash: newHash } }
        );
      }
      updated++;
    }

    logger.info(
      DRY_RUN
        ? `Would update ${updated} setup(s). Run without DRY_RUN to apply.`
        : `Updated ${updated} setup(s).`
    );
    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
