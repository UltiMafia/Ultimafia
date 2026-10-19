/**
 * Rolls back the Advanced Text Effects shop item. Take a backup first
 * (scripts/db/textEffectsShopBackup.js) and pair this with a code rollback.
 *
 *   node migrations/down/textEffects.js --dry-run|--confirm [--refund] [--skip-cache]
 *
 * - Removes itemsOwned.textEffects from every user.
 * - --refund gives each owner back the 100 coins they paid.
 * - Refreshes the cached user info of every changed user.
 */
require("dotenv").config();
const db = require("../../db/db");
const { PRICE, query, users, refreshCaches } = require("../../scripts/db/textEffectsShopData");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
// --skip-cache: no Redis access here; cached user info expires within an hour.
const skipCache = args.includes("--skip-cache");
const confirmed = args.includes("--confirm");
const refund = args.includes("--refund");

(async function () {
  if (!dryRun && !confirmed) throw new Error("Pass --dry-run to preview or --confirm to apply.");
  await db.promise;
  const docs = await users().find(query).project({ _id: 0, id: 1, "itemsOwned.textEffects": 1 }).toArray();
  const owners = docs.filter((u) => u.itemsOwned?.textEffects > 0).map((u) => u.id);
  console.log(`Users with text effects data ${docs.length}, owners ${owners.length}${refund ? `, refund ${PRICE} coins each` : ""}`);

  if (!dryRun) {
    if (refund && owners.length)
      await users().updateMany({ id: { $in: owners } }, { $inc: { coins: PRICE } });
    await users().updateMany(query, { $unset: { "itemsOwned.textEffects": "" } });
    if (!skipCache) await refreshCaches(docs.map((u) => u.id));
  }
  console.log(dryRun ? "Dry run: nothing changed." : "Text effects data rolled back.");
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
