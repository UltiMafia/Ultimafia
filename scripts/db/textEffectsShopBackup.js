/**
 * Backs up the user field the Advanced Text Effects shop item touches.
 * Run before deploying and before any rollback; keep the folder until the
 * deploy is accepted. backups/ is git-ignored.
 *
 *   node scripts/db/textEffectsShopBackup.js [backupDir]
 *
 * Writes users.json: { id, coins, itemsOwned.textEffects } for every user
 * that has the field.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../../db/db");
const { query, projection, users, writeJson } = require("./textEffectsShopData");

const dir = process.argv[2] || path.join("backups", `text-effects-${new Date().toISOString().replace(/[:.]/g, "-")}`);

(async function () {
  await db.promise;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const docs = await users().find(query).project(projection).toArray();
  writeJson(dir, "users", docs);
  const manifest = {
    createdAt: new Date().toISOString(),
    users: docs.length,
    owners: docs.filter((u) => u.itemsOwned?.textEffects > 0).length,
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Backup written to ${dir}`, JSON.stringify(manifest));
  process.exit(0);
})().catch((e) => {
  console.error("Backup failed:", e.message);
  process.exit(1);
});
