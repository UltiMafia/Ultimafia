# New-user tutorial: DB change, prod impact and rollback

## What changes in the database
- One new field on `users`: `tutorialCompleted` (Boolean, schema default `false`).
- It is written in exactly one place: when a tutorial game ends, the game server
  sets `tutorialCompleted: true` on the human player (`Game.markTutorialCompleted`).
- No migration. Existing documents don't get the field; Mongoose reads it as `false`.
- No new collection or index. Tutorial games write nothing else: no `Game` record,
  stats, ratings, hearts, coins, kudos, achievements, daily challenges, `playedGame`
  or leave penalties.

## Prod impact
- Read cost: `/api/user/info` already loads the user's `coins`; it now also selects
  `tutorialCompleted joined` in that same query.
- Who sees the prompt: only accounts with `joined >= constants.tutorialPromptSince`
  (2026-10-15 UTC) that haven't completed a tutorial. Older accounts are never prompted.
- The prompt is soft (Skip always works); nothing is blocked server-side.
- Game servers: one tutorial game = 8 in-process bots, no extra sockets or accounts.

## Backup before deploy
    node scripts/db/tutorialCompletedBackup.js            # writes backups/tutorial-completed-<ts>/

## Rollback
1. Revert the code (the field is ignored once the code is gone).
2. Optionally clear the data:
       node scripts/db/tutorialCompletedRollback.js --unset          # dry run
       node scripts/db/tutorialCompletedRollback.js --unset --yes
   or restore a backup exactly:
       node scripts/db/tutorialCompletedRollback.js --restore backups/tutorial-completed-<ts> --yes
