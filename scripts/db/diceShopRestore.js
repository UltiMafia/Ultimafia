/**
 * Re-applies Liar's Dice Colors ownership and colors from a diceShopBackup.js
 * folder (the reverse of migrations/down/diceShop.js).
 *
 *   node scripts/db/diceShopRestore.js <backupDir> [--charge] [--dry-run] [--skip-cache]
 *
 * - Sets itemsOwned.diceColor and settings.diceColor back to the backed-up
 *   values. Other fields are not touched.
 * - --charge takes the 100 coins back from each owner (use it only if the
 *   rollback ran with --refund).
 */
require("dotenv").config();
const db = require("../../db/db");
const { PRICE, users, readJson, refreshCaches } = require("./diceShopData");

const args = process.argv.slice(2);
const dir = args[0];
const dryRun = args.includes("--dry-run");
// --skip-cache: no Redis access here; cached user info expires within an hour.
const skipCache = args.includes("--skip-cache");
const charge = args.includes("--charge");

(async function () {
  if (!dir || dir.startsWith("--")) throw new Error("Pass the backup folder.");
  const docs = readJson(dir, "users");
  if (!docs) throw new Error(`No users.json in ${dir}.`);
  await db.promise;
  let owners = 0;
  for (const user of docs) {
    const set = {};
    const owned = user.itemsOwned?.diceColor;
    if (owned != null) set["itemsOwned.diceColor"] = owned;
    if (user.settings?.diceColor != null) set["settings.diceColor"] = user.settings.diceColor;
    const inc = charge && owned > 0 ? { coins: -PRICE } : null;
    if (owned > 0) owners++;
    if (!dryRun) await users().updateOne({ id: user.id }, inc ? { $set: set, $inc: inc } : { $set: set });
  }
  if (!dryRun) if (!skipCache) await refreshCaches(docs.map((u) => u.id));
  console.log(`users: ${dryRun ? "would update" : "updated"} ${docs.length}, owners ${owners}${charge ? `, charged ${PRICE} each` : ""}`);
  process.exit(0);
})().catch((e) => {
  console.error("Restore failed:", e.message);
  process.exit(1);
});
