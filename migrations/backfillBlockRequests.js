/**
 * Files a BlockRequest for every block that existed before requests did.
 *
 * Before this change any block also kept the two users out of each other's
 * games. Afterwards a block only stops DMs and profile comments until staff
 * approve its request, so existing blocks need a request to be reviewable.
 *
 *   node migrations/backfillBlockRequests.js [--dry-run] [--approve-existing]
 *
 * Default: requests are pending (existing blocks stop blocking games until
 * approved). --approve-existing marks them approved instead, keeping today's
 * game blocking for every existing block. Requests that already exist are
 * left alone. Requests made here have legacy: true and the run time as date.
 *
 * Run scripts/db/blockRequestsBackup.js first. Undo with
 * migrations/down/blockRequests.js.
 */
require("dotenv").config();
const shortid = require("shortid");
const db = require("../db/db");
const { collection } = require("../scripts/db/blockRequestsData");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const approveExisting = args.includes("--approve-existing");

(async function () {
  await db.promise;
  const now = Date.now();
  const users = await collection("users")
    .find({ "blockedUsers.0": { $exists: true } })
    .project({ _id: 0, id: 1, blockedUsers: 1 })
    .toArray();

  let created = 0;
  let existing = 0;
  for (const user of users) {
    for (const blockedId of new Set(user.blockedUsers || [])) {
      if (!blockedId || blockedId == user.id) continue;
      const doc = {
        id: shortid.generate(),
        blockerId: user.id,
        blockedId,
        date: now,
        status: approveExisting ? "approved" : "pending",
        legacy: true,
        __v: 0,
      };
      if (approveExisting) doc.approvedAt = now;

      if (dryRun) {
        const found = await collection("blockrequests").findOne({
          blockerId: user.id,
          blockedId,
        });
        if (found) existing++;
        else created++;
        continue;
      }

      const result = await collection("blockrequests").updateOne(
        { blockerId: user.id, blockedId },
        { $setOnInsert: doc },
        { upsert: true }
      );
      if (result.upsertedCount) created++;
      else existing++;
    }
  }

  console.log(
    `${dryRun ? "would create" : "created"} ${created} ${
      approveExisting ? "approved" : "pending"
    } requests; ${existing} already had one`
  );
  process.exit(0);
})().catch((e) => {
  console.error("Backfill failed:", e.message);
  process.exit(1);
});
