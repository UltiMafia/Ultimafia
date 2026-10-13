/**
 * Rolls back the Liar's Dice Colors shop item. Take a backup first
 * (scripts/db/diceShopBackup.js) and pair this with a code rollback.
 *
 *   node migrations/down/diceShop.js --dry-run|--confirm [--refund]
 *
 * - Removes itemsOwned.diceColor and settings.diceColor from every user, so
 *   everyone is back to the default white dice.
 * - --refund gives each owner back the 100 coins they paid.
 * - Refreshes the cached user info of every changed user.
 */
require("dotenv").config();
const db = require("../../db/db");
const { PRICE, query, users, refreshCaches } = require("../../scripts/db/diceShopData");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const confirmed = args.includes("--confirm");
const refund = args.includes("--refund");

(async function () {
  if (!dryRun && !confirmed) throw new Error("Pass --dry-run to preview or --confirm to apply.");
  await db.promise;
  const docs = await users().find(query).project({ _id: 0, id: 1, "itemsOwned.diceColor": 1 }).toArray();
  const owners = docs.filter((u) => u.itemsOwned?.diceColor > 0).map((u) => u.id);
  console.log(`Users with dice color data ${docs.length}, owners ${owners.length}${refund ? `, refund ${PRICE} coins each` : ""}`);

  if (!dryRun) {
    if (refund && owners.length)
      await users().updateMany({ id: { $in: owners } }, { $inc: { coins: PRICE } });
    await users().updateMany(query, { $unset: { "itemsOwned.diceColor": "", "settings.diceColor": "" } });
    await refreshCaches(docs.map((u) => u.id));
  }
  console.log(dryRun ? "Dry run: nothing changed." : "Dice color data rolled back.");
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
