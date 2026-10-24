/**
 * Puts block requests back from a blockRequestsBackup.js folder (after a
 * rollback, when redeploying the change).
 *
 *   node scripts/db/blockRequestsRestore.js <backupDir> [--dry-run]
 *
 * Upserts each backed-up request by (blockerId, blockedId). Requests whose
 * block no longer exists in User.blockedUsers are skipped, since the block
 * was removed after the backup.
 */
require("dotenv").config();
const db = require("../../db/db");
const { collection, readJson } = require("./blockRequestsData");

const args = process.argv.slice(2);
const dir = args[0];
const dryRun = args.includes("--dry-run");

(async function () {
  if (!dir || dir.startsWith("--")) throw new Error("Pass the backup folder.");
  const docs = readJson(dir, "blockrequests");
  if (!docs) throw new Error(`No blockrequests.json in ${dir}.`);
  await db.promise;

  let restored = 0;
  let skipped = 0;
  for (const doc of docs) {
    const blocker = await collection("users").findOne(
      { id: doc.blockerId },
      { projection: { blockedUsers: 1 } }
    );
    if (!blocker || !(blocker.blockedUsers || []).includes(doc.blockedId)) {
      skipped++;
      continue;
    }
    const { _id, ...fields } = doc;
    if (!dryRun) {
      await collection("blockrequests").updateOne(
        { blockerId: doc.blockerId, blockedId: doc.blockedId },
        { $set: fields },
        { upsert: true }
      );
    }
    restored++;
  }
  console.log(
    `${dryRun ? "would restore" : "restored"} ${restored}; skipped ${skipped} whose block is gone`
  );
  process.exit(0);
})().catch((e) => {
  console.error("Restore failed:", e.message);
  process.exit(1);
});
