# Rehost original settings: DB change, prod impact and rollback

## What changes in the database
- Three new optional Boolean fields on `games` (the saved game record):
  - `originalRanked`, `originalCompetitive`: ranked / competitive as the host
    set them. `ranked` / `competitive` keep their current meaning (a leaver
    still makes the game unranked for stats and ratings).
  - `lobbyNameCustom`: whether the host typed the lobby name (`false` when it
    got the default `"<host>'s lobby"`).
- They are written once, when a game record is saved at the end of a game.
- No migration and no index. Existing records don't get the fields; rehost
  falls back to `ranked` / `competitive`, and treats a lobby name as default
  only if it is exactly `"<name>'s lobby"` for one of that game's players.
- The same three values are also in the live game settings in redis and in the
  game options sent to clients; both go away with the game.

## Prod impact
- Three small Booleans per new game record. No extra queries when a game ends.
- A rehost from a saved record now also loads the players' names (one
  `populate` on a single game) to tell default names from custom ones.
- Stats, ratings and hearts are unchanged: they still use `ranked` /
  `competitive`, which a leaver still downgrades.

## Backup before deploy
    node scripts/db/rehostFieldsBackup.js        # writes backups/rehost-fields-<ts>/

Before the deploy this finds no games; take it again before any rollback.

## Rollback
1. Revert the code. The previous code never selects or writes these fields:
   Mongoose leaves unknown fields alone on read and save, the old rehost query
   lists its fields explicitly, and the old client ignores extra keys in the
   game options. A restart clears live games, so nothing in redis carries over.
2. Optional cleanup:
       node migrations/down/rehostFields.js           # dry run
       node migrations/down/rehostFields.js --yes
   To go forward again after cleanup, redeploy and restore the backup:
       node migrations/down/rehostFields.js --restore backups/rehost-fields-<ts> --yes
