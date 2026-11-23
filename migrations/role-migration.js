require("dotenv").config();
const mongoose = require("mongoose");
const oHash = require("object-hash");
const models = require("../db/models");
const roleData = require("../data/roles");
const logger = require("../modules/logging")(".");

/**
 * Migration: retire "No Event" from Mafia setups, and rewrite Soprano.
 *
 * "No Event" was a blank event-pool entry. Each non-banished copy is converted
 * into NoEventChance, the percent of event slots that should be skipped:
 *
 *   chance = round(100 * noEventCopies / nonBanishedEventCopies)
 *
 * Only rolesets that contain a non-banished "No Event" are counted, so an
 * alternate roleset made entirely of real events does not dilute the chance.
 *
 * Every "No Event" key is then deleted, including modified keys such as
 * "No Event:Banished". Banished copies are removed and do not affect the
 * percentage.
 *
 * Soprano is rewritten in the same pass. Each setup role key
 * is "Name" or "Name:Mod1/Mod2". A modifier is added only when it is missing,
 * and the modifier list is sorted alphabetically. Counts for keys that land
 * on the same string are added together.
 *
 *   Soprano -> Doctor:Rakish
 *
 * Counts are the role-key weights already stored on the setup.
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
const RETIRED_EVENT = "No Event";

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

const ROLE_REPLACEMENTS = {
  Soprano: { name: "Doctor", addModifier: "Rakish" },
};

function isBanishedKey(key) {
  const mods = key.split(":")[1] || "";
  return mods.toLowerCase().includes("banished");
}

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

function replaceRetiredRoleKey(key) {
  const { name, mods } = splitRoleKey(key);
  const replacement = ROLE_REPLACEMENTS[name];
  if (!replacement) {
    return { newKey: key, changed: false };
  }

  let newMods = mods;
  if (replacement.addModifier && !mods.includes(replacement.addModifier)) {
    newMods = mods
      .concat(replacement.addModifier)
      .sort((a, b) => a.localeCompare(b));
  }

  const newKey = joinRoleKey(replacement.name, newMods);
  return { newKey, changed: newKey !== key };
}

function isEventKey(key) {
  const name = key.split(":")[0];
  return roleData.Mafia[name] && roleData.Mafia[name].alignment === "Event";
}

function removeNoEventFromRoles(rolesJson) {
  const roles = JSON.parse(rolesJson);
  let changed = false;
  let noEvent = 0;
  let events = 0;
  const changes = [];

  const newRoles = roles.map((roleset) => {
    const next = {};
    let setNoEvent = 0;
    let setEvents = 0;
    for (const key of Object.keys(roleset)) {
      const count = Number(roleset[key]) || 0;
      const name = key.split(":")[0];
      const banished = isBanishedKey(key);

      if (name === RETIRED_EVENT) {
        changed = true;
        changes.push(`removed ${key} x${count}`);
        if (!banished) {
          setNoEvent += count;
          setEvents += count;
        }
        continue;
      }

      const { newKey, changed: keyChanged } = replaceRetiredRoleKey(key);
      if (keyChanged) {
        changed = true;
        const change = `${key} -> ${newKey}`;
        if (!changes.includes(change)) changes.push(change);
      }

      if (!isBanishedKey(newKey) && isEventKey(newKey)) setEvents += count;
      next[newKey] = (next[newKey] || 0) + count;
    }
    if (setNoEvent > 0) {
      noEvent += setNoEvent;
      events += setEvents;
    }
    return next;
  });

  const chance =
    noEvent > 0 && events > 0 ? Math.round((100 * noEvent) / events) : null;

  return {
    newRoles: JSON.stringify(newRoles),
    changed,
    changes,
    chance,
  };
}

function computeHash(doc, newRolesString, noEventChance) {
  const plain = doc.toObject();
  const countObj =
    doc.count instanceof Map ? Object.fromEntries(doc.count) : doc.count;
  const hashed = {
    ...plain,
    roles: newRolesString,
    count: JSON.stringify(countObj),
  };
  if (noEventChance != null) hashed.NoEventChance = noEventChance;
  return oHash(hashed);
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
      const { newRoles, changed, changes, chance } = removeNoEventFromRoles(
        setup.roles
      );

      if (!changed) continue;

      const newHash = computeHash(setup, newRoles, chance);
      const update = { roles: newRoles, hash: newHash };
      if (chance != null) {
        update.NoEventChance = chance;
        changes.push(`Chance of No Event: ${chance}%`);
      }

      logger.info(
        `Setup ${setup.id} (${setup.name || "unnamed"}): ${changes.join("; ")}`
      );

      if (!DRY_RUN) {
        await models.Setup.updateOne({ id: setup.id }, { $set: update });
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
  removeNoEventFromRoles,
};
