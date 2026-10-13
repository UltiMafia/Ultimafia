# Deploy and rollback: Liar's Dice Colors shop item

Merge after the game chat core, Liar's Dice engine and Liar's Dice sprites changes; this one comes last.

## What changes in the database

| Change | When it happens |
|--------|-----------------|
| `users.itemsOwned.diceColor` (Number, default 0) in the schema | Nothing is written until a user buys the item. Mongoose fills the 0 default on read. |
| `itemsOwned.diceColor` set to 1 and `coins` decreased by 100 | When a user buys "Liar's Dice Colors" in the Shop |
| `users.settings.diceColor` (`#rrggbb`) | When an owner picks a color in Settings (from #38; now refused unless owned) |

No collections, indexes or startup migrations. Existing shop items keep their list positions (the new item is appended), so open Shop pages still buy the right item.

## Before deploying

```
node scripts/db/diceShopBackup.js backups/dice-shop-pre-deploy
```

Writes `users.json` with `id`, `coins`, `itemsOwned.diceColor` and `settings.diceColor` for every user that has either field (before the first deploy this is normally empty, apart from anyone who used the #38 setting).

## Rollback

1. Back up the current state: `node scripts/db/diceShopBackup.js backups/dice-shop-pre-rollback`
2. Roll the code back.
3. `node migrations/down/diceShop.js --dry-run`, then `--confirm` (add `--refund` to give buyers their 100 coins back).
4. Restart games so open lobbies drop cached colors (www needs no restart; the script refreshes the user caches).

## Re-applying after a rollback

1. Deploy the code again.
2. `node scripts/db/diceShopRestore.js backups/dice-shop-pre-rollback` (add `--charge` only if the rollback used `--refund`).

## Prod impact

- One extra shop item and one extra Number field on users that buy it; no new queries on hot paths.
- In game, each Liar's Dice player entry gains a 7-character color string. Dice values are still only sent to their owner.
- The Settings check adds no query (it uses the cached `itemsOwned` already read by that route).
