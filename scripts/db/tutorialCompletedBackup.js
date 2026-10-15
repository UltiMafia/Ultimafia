/**
 * Backs up users.tutorialCompleted (ids of users who have it set) before
 * deploying or rolling back the new-user tutorial. backups/ is git-ignored.
 *
 *   node scripts/db/tutorialCompletedBackup.js [backupDir]
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const db = require("../../db/db");

const dir =
  process.argv[2] ||
  path.join("backups", `tutorial-completed-${new Date().toISOString().replace(/[:.]/g, "-")}`);

(async function () {
  await db.promise;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const users = mongoose.connection.db.collection("users");
  const docs = await users
    .find({ tutorialCompleted: { $exists: true } })
    .project({ _id: 0, id: 1, tutorialCompleted: 1 })
    .toArray();
  fs.writeFileSync(path.join(dir, "tutorialCompleted.json"), JSON.stringify(docs), { mode: 0o600 });
  const manifest = {
    createdAt: new Date().toISOString(),
    usersWithField: docs.length,
    completed: docs.filter((d) => d.tutorialCompleted).length,
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Backup written to ${dir}`, JSON.stringify(manifest));
  process.exit(0);
})().catch((e) => {
  console.error("Backup failed:", e.message);
  process.exit(1);
});
