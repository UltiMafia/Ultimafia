require("dotenv").config();
const mongoose = require("mongoose");
const oHash = require("object-hash");
const models = require("../db/models");
const logger = require("../modules/logging")(".");

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

function replaceModifierInRoleKey(key) {
  const colonIdx = key.indexOf(":");
  if (colonIdx === -1) {
    return { newKey: key, changed: false };
  }

  const rolePart = key.slice(0, colonIdx + 1);
  const modPart = key.slice(colonIdx + 1);
  if (!modPart) {
    return { newKey: key, changed: false };
  }

  const mods = modPart.split("/");
  if (!mods.includes(OLD_MODIFIER)) {
    return { newKey: key, changed: false };
  }

  const newMods = mods.map((m) => (m === OLD_MODIFIER ? NEW_MODIFIER : m));
  return { newKey: rolePart + newMods.join("/"), changed: true };
}

function replaceModifierInRoleset(roleset) {
  const newRoleset = {};
  let changed = false;
  for (const key of Object.keys(roleset)) {
    const count = roleset[key];
    const { newKey, changed: keyChanged } = replaceModifierInRoleKey(key);
    if (keyChanged) changed = true;
    newRoleset[newKey] = (newRoleset[newKey] || 0) + count;
  }
  return { newRoleset, changed };
}

function replaceModifierInRoles(rolesJson) {
  const roles = JSON.parse(rolesJson);
  let anyChanged = false;
  const newRoles = [];
  for (const roleset of roles) {
    const { newRoleset, changed } = replaceModifierInRoleset(roleset);
    newRoles.push(newRoleset);
    if (changed) anyChanged = true;
  }
  return { newRoles: JSON.stringify(newRoles), changed: anyChanged };
}

function computeHash(doc, newRolesString) {
  const plain = doc.toObject();
  const countObj =
    doc.count instanceof Map ? Object.fromEntries(doc.count) : doc.count;
  return oHash({
    ...plain,
    roles: newRolesString,
    count: JSON.stringify(countObj),
  });
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
      const { newRoles, changed } = replaceModifierInRoles(setup.roles);

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
