const mongoose = require("mongoose");
const oHash = require("object-hash");
const models = require("../db/models");
const logger = require("../modules/logging")(".");

/**
 * Migration: Replace OLD_ROLE with the role you added to data/renamedRoles.js, as well as NEW_ROLE with the role you're changing it to
 *
 * Use DRY_RUN=true to only log what would be changed:
 *   DRY_RUN=true node migrations/migrate-ripper-to-supervillain.js
 *
 * For production, use the same env as the app (e.g. MONGO_URL, MONGO_DB, MONGO_USER, MONGO_PW).
 */

const DRY_RUN = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";

const OLD_ROLE = "Ripper";
const NEW_ROLE = "Supervillain";

function replaceRipperInRoleset(roleset) {
  const newRoleset = {};
  let changed = false;
  for (const key of Object.keys(roleset)) {
    const count = roleset[key];
    let newKey = key;
    if (key === OLD_ROLE) {
      newKey = NEW_ROLE;
      changed = true;
    } else if (key.startsWith(OLD_ROLE + ":")) {
      newKey = NEW_ROLE + key.slice(OLD_ROLE.length);
      changed = true;
    }
    newRoleset[newKey] = (newRoleset[newKey] || 0) + count;
  }
  return { newRoleset, changed };
}

function replaceRipperInRoles(rolesJson) {
  const roles = JSON.parse(rolesJson);
  let anyChanged = false;
  const newRoles = [];
  for (const roleset of roles) {
    const { newRoleset, changed } = replaceRipperInRoleset(roleset);
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
    await mongoose.connect(
      process.env.MONGO_URL || "mongodb://localhost:27017/ultimafia",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    logger.info("Connected to database");
    if (DRY_RUN) logger.info("DRY RUN – no changes will be written");

    const setups = await models.Setup.find({ gameType: "Mafia" });
    let updated = 0;

    for (const setup of setups) {
      const { newRoles, changed } = replaceRipperInRoles(setup.roles);

      if (!changed) continue;

      const newHash = computeHash(setup, newRoles);

      logger.info(
        `Setup ${setup.id} (${setup.name || "unnamed"}): replacing ${OLD_ROLE} with ${NEW_ROLE}`
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
