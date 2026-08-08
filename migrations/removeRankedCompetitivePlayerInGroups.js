/**
 * Remove Ranked Player and Competitive Player InGroup memberships.
 *
 * Ranked/Competitive access is now a default permission; these group
 * memberships are no longer used for gating joins.
 *
 * Does NOT delete the Group documents themselves (mod tools may still
 * reference them). Only InGroup links are removed.
 *
 * Run:
 *   node migrations/removeRankedCompetitivePlayerInGroups.js
 *   node migrations/removeRankedCompetitivePlayerInGroups.js --dry-run
 *
 * Requires .env with MONGO_URL / MONGO_DB / MONGO_USER / MONGO_PW
 * (same as other migrations / docs/server_env).
 *
 * After running, Redis user perm caches expire within ~1 hour, or clear
 * them sooner if you need permissions refreshed immediately.
 */

require("dotenv").config();
const models = require("../db/models");

const GROUP_NAMES = ["Ranked Player", "Competitive Player"];
const dryRun = process.argv.includes("--dry-run");

async function migrate() {
  console.log(
    dryRun
      ? "DRY RUN — no documents will be deleted."
      : "Removing Ranked Player / Competitive Player InGroup documents..."
  );

  const groups = await models.Group.find({
    name: { $in: GROUP_NAMES },
  }).select("_id name");

  if (groups.length === 0) {
    console.log("No Ranked Player or Competitive Player groups found. Nothing to do.");
    return { deletedCount: 0 };
  }

  for (const group of groups) {
    console.log(`Found group "${group.name}" (${group._id})`);
  }

  const groupIds = groups.map((g) => g._id);
  const foundNames = new Set(groups.map((g) => g.name));
  for (const name of GROUP_NAMES) {
    if (!foundNames.has(name)) {
      console.log(`Group "${name}" not found (skipping).`);
    }
  }

  const match = { group: { $in: groupIds } };
  const count = await models.InGroup.countDocuments(match);
  console.log(`InGroup documents matching these groups: ${count}`);

  if (count === 0) {
    console.log("Nothing to delete.");
    return { deletedCount: 0 };
  }

  if (dryRun) {
    console.log(`Would delete ${count} InGroup document(s). Re-run without --dry-run to apply.`);
    return { deletedCount: 0, wouldDelete: count };
  }

  const result = await models.InGroup.deleteMany(match);
  console.log(`Deleted ${result.deletedCount} InGroup document(s).`);
  return { deletedCount: result.deletedCount };
}

if (require.main === module) {
  const db = require("../db/db");

  db.promise
    .then(() => migrate())
    .then((result) => {
      console.log("Migration complete.", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = migrate;
