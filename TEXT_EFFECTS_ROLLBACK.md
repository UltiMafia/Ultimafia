# Deploy and rollback: Advanced Text Effects shop item

## What changes in the database

| Change | When it happens |
|--------|-----------------|
| `users.itemsOwned.textEffects` (Number, default 0) in the schema | Nothing is written until a user buys the item. Mongoose fills the 0 default on read. |
| `itemsOwned.textEffects` set to 1 and `coins` decreased by 100 | When a user buys "Advanced Text Effects" in the Shop |

No collections, indexes or startup migrations. The new item is appended to the shop list, so existing items keep their positions and open Shop pages still buy the right item. Chat messages are not stored differently: the content is the plain text, and the effect is an extra `textEffect` field on in-game messages (and so in saved game history).

## Before deploying

```
node scripts/db/textEffectsShopBackup.js backups/text-effects-pre-deploy
```

Writes `users.json` with `id`, `coins` and `itemsOwned.textEffects` for every user that has the field (normally empty before the first deploy).

## Rollback

1. Back up the current state: `node scripts/db/textEffectsShopBackup.js backups/text-effects-pre-rollback`
2. Roll the code back.
3. `node migrations/down/textEffects.js --dry-run`, then `--confirm` (add `--refund` to give buyers their 100 coins back).
4. Restart games so open games drop the cached ownership (www needs no restart; the script refreshes the user caches).

Old game history that already has `textEffect` fields is harmless after a rollback: the old client ignores the field and shows the plain text.

## Re-applying after a rollback

1. Deploy the code again.
2. `node scripts/db/textEffectsShopRestore.js backups/text-effects-pre-rollback` (add `--charge` only if the rollback used `--refund`).

## Prod impact

- One extra shop item and one extra Number field on users that buy it; no new queries. Ownership is read from the cached `itemsOwned` that game users already load.
- In game, a message sent with an effect carries one extra short string (`textEffect`). Messages without an effect are unchanged.
- The client draws effects with CSS only, plays them once on new messages, and shows plain text to anyone with reduced motion turned on.
