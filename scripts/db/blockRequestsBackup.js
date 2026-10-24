/**
 * Backs up what the game-block approval change touches. Run before the
 * backfill, before deploying and before any rollback; keep the folder until
 * the deploy is accepted. backups/ is git-ignored.
 *
 *   node scripts/db/blockRequestsBackup.js [backupDir]
 *
 * Writes:
 *   users.json          { id, blockedUsers } for every user with a block
 *   blockrequests.json  every BlockRequest document (empty before deploy)
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../../db/db");
const { collection, writeJson } = require("./blockRequestsData");

const dir =
  process.argv[2] ||
  path.join(
    "backups",
    `block-requests-${new Date().toISOString().replace(/[:.]/g, "-")}`
  );

(async function () {
  await db.promise;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const users = await collection("users")
    .find({ "blockedUsers.0": { $exists: true } })
    .project({ _id: 0, id: 1, blockedUsers: 1 })
    .toArray();
  const requests = await collection("blockrequests").find({}).toArray();
  writeJson(dir, "users", users);
  writeJson(dir, "blockrequests", requests);
  const manifest = {
    createdAt: new Date().toISOString(),
    usersWithBlocks: users.length,
    blocks: users.reduce((n, u) => n + (u.blockedUsers || []).length, 0),
    blockRequests: requests.length,
  };
  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`Backup written to ${dir}`, JSON.stringify(manifest));
  process.exit(0);
})().catch((e) => {
  console.error("Backup failed:", e.message);
  process.exit(1);
});
