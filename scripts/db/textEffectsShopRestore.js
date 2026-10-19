/**
 * Re-applies Advanced Text Effects ownership from a textEffectsShopBackup.js
 * folder (the reverse of migrations/down/textEffects.js).
 *
 *   node scripts/db/textEffectsShopRestore.js <backupDir> [--charge] [--dry-run] [--skip-cache]
 *
 * - Sets itemsOwned.textEffects back to the backed-up value. Other fields are
 *   not touched.
 * - --charge takes the 100 coins back from each owner (use it only if the
 *   rollback ran with --refund).
 */
require("dotenv").config();
const db = require("../../db/db");
const { PRICE, users, readJson, refreshCaches } = require("./textEffectsShopData");

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
    const owned = user.itemsOwned?.textEffects;
    if (owned == null) continue;
    const inc = charge && owned > 0 ? { coins: -PRICE } : null;
    if (owned > 0) owners++;
    const set = { "itemsOwned.textEffects": owned };
    if (!dryRun) await users().updateOne({ id: user.id }, inc ? { $set: set, $inc: inc } : { $set: set });
  }
  if (!dryRun) if (!skipCache) await refreshCaches(docs.map((u) => u.id));
  console.log(`users: ${dryRun ? "would update" : "updated"} ${docs.length}, owners ${owners}${charge ? `, charged ${PRICE} each` : ""}`);
  process.exit(0);
})().catch((e) => {
  console.error("Restore failed:", e.message);
  process.exit(1);
});
