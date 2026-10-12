require("dotenv").config();
const mongoose = require("mongoose");
const oHash = require("object-hash");
const models = require("../db/models");
const logger = require("../modules/logging")(".");

/**
 * Migration: fold retired Mafia events into Airdrop.
 *
 * Each setup role key is "Name" or "Name:Mod1/Mod2". Replacements run once per
 * key, so a Moonshine that becomes Airdrop is not then given Armed.
 *
 *   Airdrop            -> Airdrop:Armed   (Armed is added if missing; other modifiers stay)
 *   Moonshine          -> Airdrop         (modifiers unchanged)
 *   Ominous Warning    -> Airdrop:Steeled (Steeled is added if missing)
 *   Vaccination        -> Airdrop:Macabre (Macabre is added if missing)
 *
 * When a modifier is added, the modifier list is sorted alphabetically so
 * "Airdrop:Banished" becomes "Airdrop:Armed/Banished". Counts for keys that
 * land on the same string are added together.
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
 *   DRY_RUN=true node migrations/role-migration.js
 *
 *   # Apply updates:
 *   node migrations/role-migration.js
 *
 * Example with inline env (production-style):
 *   MONGO_URL=your-host:27017 MONGO_DB=ultimafia MONGO_USER=... MONGO_PW=... node migrations/role-migration.js
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

const EVENT_REPLACEMENTS = {
  Airdrop: { name: "Airdrop", addModifier: "Armed" },
  Moonshine: { name: "Airdrop" },
  "Ominous Warning": { name: "Airdrop", addModifier: "Steeled" },
  Vaccination: { name: "Airdrop", addModifier: "Macabre" },
};

function splitRoleKey(key) {
  const colonIdx = key.indexOf(":");
  if (colonIdx === -1) {
    return { name: key, mods: [] };
  }
  const name = key.slice(0, colonIdx);
  const modPart = key.slice(colonIdx + 1);
  return { name, mods: modPart ? modPart.split("/") : [] };
}

function joinRoleKey(name, mods) {
  if (!mods.length) return name;
  return `${name}:${mods.join("/")}`;
}

function replaceEventsInRoleKey(key) {
  const { name, mods } = splitRoleKey(key);
  const replacement = EVENT_REPLACEMENTS[name];
  if (!replacement) {
    return { newKey: key, changed: false };
  }

  let newMods = mods;
  if (replacement.addModifier && !mods.includes(replacement.addModifier)) {
    newMods = mods.concat(replacement.addModifier).sort((a, b) => a.localeCompare(b));
  }

  const newKey = joinRoleKey(replacement.name, newMods);
  return { newKey, changed: newKey !== key };
}

function replaceEventsInRoleset(roleset) {
  const newRoleset = {};
  let changed = false;
  const keyChanges = [];
  for (const key of Object.keys(roleset)) {
    const count = roleset[key];
    const { newKey, changed: keyChanged } = replaceEventsInRoleKey(key);
    if (keyChanged) {
      changed = true;
      const change = `${key} -> ${newKey}`;
      if (!keyChanges.includes(change)) keyChanges.push(change);
    }
    newRoleset[newKey] = (newRoleset[newKey] || 0) + count;
  }
  return { newRoleset, changed, keyChanges };
}

function replaceEventsInRoles(rolesJson) {
  const roles = JSON.parse(rolesJson);
  let anyChanged = false;
  const newRoles = [];
  const changes = [];
  for (const roleset of roles) {
    const { newRoleset, changed, keyChanges } = replaceEventsInRoleset(roleset);
    newRoles.push(newRoleset);
    if (changed) anyChanged = true;
    for (const change of keyChanges) {
      if (!changes.includes(change)) changes.push(change);
    }
  }
  return { newRoles: JSON.stringify(newRoles), changed: anyChanged, changes };
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
      const { newRoles, changed, changes } = replaceEventsInRoles(setup.roles);

      if (!changed) continue;

      const newHash = computeHash(setup, newRoles);

      logger.info(
        `Setup ${setup.id} (${setup.name || "unnamed"}): ${changes.join("; ")}`
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

if (require.main === module) {
  migrate();
}

module.exports = {
  replaceEventsInRoleKey,
  replaceEventsInRoles,
};
