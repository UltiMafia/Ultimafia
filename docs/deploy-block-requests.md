# Deploying block requests (game blocks need staff approval)

## What changes in the database

- New collection `blockrequests` (model `BlockRequest`): one document per
  block, `{ id, blockerId, blockedId, date, status: pending|approved,
  approvedBy, approvedAt, legacy }`, unique on `(blockerId, blockedId)`.
- `User.blockedUsers` keeps its meaning (who the user blocked) and is not
  rewritten.
- New permission `approveGameBlocks`, added to the Owner and Admin groups by
  the normal startup group sync.

## Prod impact

Before this change every block also kept the two users out of each other's
games. After it, a block stops DMs and profile comments straight away, but
game joins are only blocked once staff approve the request.

Existing blocks have no request until the backfill runs. Without the
backfill they stop blocking game joins and do not show up for review.

## Steps

1. Back up: `node scripts/db/blockRequestsBackup.js` (writes `backups/block-requests-<time>/`).
2. Deploy and restart www, games and chat; rebuild the client.
3. Backfill, after a dry run:
   - `node migrations/backfillBlockRequests.js --dry-run`
   - `node migrations/backfillBlockRequests.js` files pending requests, so
     existing blocks wait for review like new ones; or
   - `node migrations/backfillBlockRequests.js --approve-existing` keeps
     today's game blocking for every existing block (marked approved).

## Rollback

1. `node scripts/db/blockRequestsBackup.js` (keeps any approvals).
2. Redeploy the previous build. It ignores `blockrequests`, so every block
   blocks game joins again as before.
3. Optionally `node migrations/down/blockRequests.js` to drop the collection.
4. To go forward again: redeploy, then `node scripts/db/blockRequestsRestore.js <backupDir>`.
