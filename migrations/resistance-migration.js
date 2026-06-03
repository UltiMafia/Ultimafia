const mongoose = require("mongoose");
const oHash = require("object-hash");
const models = require("../db/models");
const logger = require("../modules/logging")(".");

/**
 * Migration: convert Resistance setups to Mafia setups (Spymaster mission mode).
 *
 * Role mapping:
 *   Rebel → Villager
 *   Merlin → Seer
 *   Percival → Seer:Retired
 *   Tristan / Isolde → Templar
 *   Spy → Spymaster
 *   Oberon → Mafioso:Lone
 *   Mordred → Godfather
 *   Morgana → Charlatan
 *   Assassin → Resistance Assassin
 *   Lunatic → Mafioso (fallback for unlisted Resistance roles → Villager)
 *
 * Count mapping: Resistance → Village, Spies → Mafia (Cult/Independent default 0).
 *
 * How to run
 * ----------
 *   DRY_RUN=true node migrations/resistance-migration.js
 *   node migrations/resistance-migration.js
 *
 * Uses MONGO_URL, MONGO_DB, MONGO_USER, MONGO_PW (same as other migrations).
 */

const DRY_RUN = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";

const ROLE_MAP = {
  Rebel: "Villager",
  Merlin: "Seer",
  Percival: "Seer:Retired",
  Tristan: "Templar",
  Isolde: "Templar",
  Spy: "Spymaster",
  Oberon: "Mafioso:Lone",
  Mordred: "Godfather",
  Morgana: "Charlatan",
  Assassin: "Resistance Assassin",
  Lunatic: "Mafioso",
};

const DEFAULT_MISSION_OPTIONS = {
  firstTeamSize: 2,
  lastTeamSize: 4,
  numMissions: 5,
  teamFailLimit: 5,
};

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

function mapRoleKey(key) {
  const colonIdx = key.indexOf(":");
  const roleName = colonIdx === -1 ? key : key.slice(0, colonIdx);
  const modSuffix = colonIdx === -1 ? "" : key.slice(colonIdx);

  if (roleName === "Seer (Retired)") {
    return "Seer:Retired" + modSuffix;
  }

  if (roleName === "Oberon") {
    if (!modSuffix) return "Mafioso:Lone";
    const mods = modSuffix.slice(1);
    if (mods.split("/").includes("Lone")) {
      return `Mafioso:${mods}`;
    }
    return `Mafioso:Lone/${mods}`;
  }

  const mapped = ROLE_MAP[roleName];
  if (!mapped) {
    logger.warn(`Unknown Resistance role "${roleName}" → Villager`);
    return "Villager" + modSuffix;
  }

  if (mapped.includes(":") && !modSuffix) {
    return mapped;
  }

  if (mapped.includes(":") && modSuffix) {
    const mappedMods = mapped.slice(mapped.indexOf(":") + 1);
    const extraMods = modSuffix.slice(1);
    return `${mapped.split(":")[0]}:${mappedMods}/${extraMods}`;
  }

  return mapped + modSuffix;
}

function migrateRoleset(roleset) {
  const newRoleset = {};
  let changed = false;

  for (const key of Object.keys(roleset)) {
    const count = roleset[key];
    const newKey = mapRoleKey(key);
    if (newKey !== key) changed = true;
    newRoleset[newKey] = (newRoleset[newKey] || 0) + count;
  }

  return { newRoleset, changed };
}

function migrateRolesJson(rolesJson) {
  const roles = JSON.parse(rolesJson);
  let anyChanged = false;
  const newRoles = [];

  for (const roleset of roles) {
    const { newRoleset, changed } = migrateRoleset(roleset);
    newRoles.push(newRoleset);
    if (changed) anyChanged = true;
  }

  return { newRoles: JSON.stringify(newRoles), changed: anyChanged };
}

function migrateCount(count) {
  const c =
    count instanceof Map ? Object.fromEntries(count) : { ...(count || {}) };

  return {
    Village: Number(c.Resistance || 0) + Number(c.Village || 0),
    Mafia: Number(c.Spies || 0) + Number(c.Mafia || 0),
    Cult: Number(c.Cult || 0),
    Independent: Number(c.Independent || 0),
  };
}

function migrateRoleStats(statsObj) {
  if (!statsObj || typeof statsObj !== "object") {
    return { stats: statsObj, changed: false };
  }

  const next = {};
  let changed = false;

  for (const key of Object.keys(statsObj)) {
    const colonIdx = key.indexOf(":");
    const roleName = colonIdx === -1 ? key : key.slice(0, colonIdx);
    const modSuffix = colonIdx === -1 ? "" : key.slice(colonIdx);

    if (roleName === "Seer (Retired)") {
      const newKey = "Seer:Retired" + modSuffix;
      if (newKey !== key) changed = true;
      next[newKey] = (next[newKey] || 0) + Number(statsObj[key] || 0);
      continue;
    }

    const mappedBase = ROLE_MAP[roleName];
    let newKey;

    if (roleName === "Oberon") {
      newKey = mapRoleKey(key);
    } else if (mappedBase) {
      newKey =
        mappedBase.includes(":") && !modSuffix
          ? mappedBase
          : mappedBase + modSuffix;
    } else {
      newKey = "Villager" + modSuffix;
    }

    if (newKey !== key) changed = true;
    next[newKey] = (next[newKey] || 0) + Number(statsObj[key] || 0);
  }

  return { stats: next, changed };
}

function computeHash(doc, updates) {
  const plain = doc.toObject();
  const countObj =
    updates.count instanceof Map
      ? Object.fromEntries(updates.count)
      : updates.count;

  return oHash({
    ...plain,
    ...updates,
    roles: updates.roles,
    count: JSON.stringify(countObj),
  });
}

function missionDefaults(setup) {
  return {
    firstTeamSize:
      Number(setup.firstTeamSize) || DEFAULT_MISSION_OPTIONS.firstTeamSize,
    lastTeamSize:
      Number(setup.lastTeamSize) || DEFAULT_MISSION_OPTIONS.lastTeamSize,
    numMissions:
      Number(setup.numMissions) || DEFAULT_MISSION_OPTIONS.numMissions,
    teamFailLimit:
      Number(setup.teamFailLimit) || DEFAULT_MISSION_OPTIONS.teamFailLimit,
  };
}

async function migrate() {
  try {
    const { uri, options } = mongoConnectOptions();
    await mongoose.connect(uri, options);

    logger.info("Connected to database");
    if (DRY_RUN) logger.info("DRY RUN – no changes will be written");

    const setups = await models.Setup.find({ gameType: "Resistance" });
    let updated = 0;

    for (const setup of setups) {
      const { newRoles, changed: rolesChanged } = migrateRolesJson(setup.roles);
      const newCount = migrateCount(setup.count);
      const { stats: rolePlays, changed: playsChanged } = migrateRoleStats(
        setup.rolePlays
      );
      const { stats: roleWins, changed: winsChanged } = migrateRoleStats(
        setup.roleWins
      );
      const mission = missionDefaults(setup);

      const updates = {
        gameType: "Mafia",
        roles: newRoles,
        count: newCount,
        startState: "Night",
        rolePlays,
        roleWins,
        ...mission,
      };

      const newHash = computeHash(setup, updates);

      logger.info(
        `Setup ${setup.id} (${setup.name || "unnamed"}): Resistance → Mafia`
      );

      if (!DRY_RUN) {
        await models.Setup.updateOne(
          { id: setup.id },
          {
            $set: {
              ...updates,
              hash: newHash,
              updatedAt: Date.now(),
            },
          }
        );
      }
      updated++;
    }

    logger.info(
      DRY_RUN
        ? `Would migrate ${updated} Resistance setup(s). Run without DRY_RUN to apply.`
        : `Migrated ${updated} Resistance setup(s) to Mafia.`
    );
    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
