/**
 * Backs up the data the Developer API, game log and GitHub link features touch.
 * Run before deploying, and keep the folder until the deploy is accepted.
 *
 *   node scripts/db/backupFeatureData.js [backupDir]
 *
 * Writes EJSON files: groups, ingroups, devapikeys, modactions, and
 * users.json with only { id, github, contributorTypes } per user.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../../db/db");
const { collections, userFields, collection, writeJson } = require("./featureData");

const dir = process.argv[2] || path.join("backups", `feature-data-${new Date().toISOString().replace(/[:.]/g, "-")}`);

(async function () {
  await db.promise;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const manifest = { createdAt: new Date().toISOString(), counts: {} };
  for (const name of collections) {
    const docs = await collection(name).find({}).toArray();
    writeJson(dir, name, docs);
    manifest.counts[name] = docs.length;
  }
  const users = await collection("users")
    .find({ $or: [{ github: { $exists: true } }, { "contributorTypes.0": { $exists: true } }] })
    .project(userFields)
    .toArray();
  writeJson(dir, "users", users);
  manifest.counts.users = users.length;
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Backup written to ${dir}`, JSON.stringify(manifest.counts));
  process.exit(0);
})().catch((e) => {
  console.error("Backup failed:", e.message);
  process.exit(1);
});
