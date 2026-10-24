/**
 * Rollback for the game-block approval change.
 *
 * The change adds one collection (blockrequests) and never rewrites
 * User.blockedUsers, so redeploying the previous code restores the old
 * behaviour (any block also blocks game joins) on its own. This script only
 * removes the collection the old code does not use.
 *
 *   node migrations/down/blockRequests.js [--dry-run]
 *
 * Take scripts/db/blockRequestsBackup.js first: approvals are lost otherwise.
 * To go forward again, redeploy and restore with
 * scripts/db/blockRequestsRestore.js <backupDir>.
 */
require("dotenv").config();
const db = require("../../db/db");
const { collection } = require("../../scripts/db/blockRequestsData");

const dryRun = process.argv.includes("--dry-run");

(async function () {
  await db.promise;
  const count = await collection("blockrequests").countDocuments();
  if (!dryRun) {
    await collection("blockrequests")
      .drop()
      .catch((e) => {
        if (e.codeName != "NamespaceNotFound") throw e;
      });
  }
  console.log(`${dryRun ? "would drop" : "dropped"} blockrequests (${count} documents)`);
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
