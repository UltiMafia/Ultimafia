/**
 * Backs up the user fields the Liar's Dice Colors shop item touches.
 * Run before deploying and before any rollback; keep the folder until the
 * deploy is accepted. backups/ is git-ignored.
 *
 *   node scripts/db/diceShopBackup.js [backupDir]
 *
 * Writes users.json: { id, coins, itemsOwned.diceColor, settings.diceColor }
 * for every user that has either field.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../../db/db");
const { query, projection, users, writeJson } = require("./diceShopData");

const dir = process.argv[2] || path.join("backups", `dice-shop-${new Date().toISOString().replace(/[:.]/g, "-")}`);

(async function () {
  await db.promise;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const docs = await users().find(query).project(projection).toArray();
  writeJson(dir, "users", docs);
  const manifest = {
    createdAt: new Date().toISOString(),
    users: docs.length,
    owners: docs.filter((u) => u.itemsOwned?.diceColor > 0).length,
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Backup written to ${dir}`, JSON.stringify(manifest));
  process.exit(0);
})().catch((e) => {
  console.error("Backup failed:", e.message);
  process.exit(1);
});
