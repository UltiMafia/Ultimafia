# Deploy and rollback: Developer API (#34), game log (#35), GitHub links (#36)

Merge into `dev` in this order: #34, then #35, then #36.

## What changes in the database

| PR | Change | When it happens |
|----|--------|-----------------|
| #34 | Groups `Developer` (visible, rank 0, `devApi`) and `Developer Public Testing` (hidden, `devTestPublic`) are created with no members. Owner gets `devApi` and `devTestPublic`. | www startup (`modules/startup.js` syncs default groups) |
| #34 | `Dev` group (hidden, no permissions) is deleted. | Only if `migrations/replaceDevGroupWithDeveloper.js --confirm` is run (optional) |
| #34 | New `devapikeys` collection | First API key created |
| #34 | Redis: `devapi:token:*` (1 h TTL), `devapi:accounts:*` (24 h TTL), `devapi:game:<id>:creator` (7 d TTL), rate limit keys | Developer use only |
| #35 | New `gameeventlogchunks` collection with a TTL index on `expireAt` (24 h for Testing games, 7 d for others) | First game that logs |
| #36 | `users.github` subdocument and a `github.status` index on `users` | www startup (index build; small, sparse in practice) |
| #36 | Admin gets `approveGithubLinks` | www startup |
| #36 | `Review GitHub Link` mod actions | Each review |

## Feature flags (no code rollback needed)

Set in the www and games env, then restart the services.

- `DEV_API_ENABLED=false`: `/api/dev/*` and bearer tokens are not mounted, the Testing lobby is hidden and refuses connections, and game sockets stop marking developers.
- `GAME_EVENT_LOG=off|testing|all` (default `all`): `testing` logs only Testing-lobby games; `off` logs nothing.
- `GITHUB_SYNC_ENABLED=false`: the hourly check never calls GitHub. Links and the contributors page keep their last values.

Recommended first prod deploy: `GAME_EVENT_LOG=testing`, then switch to `all` once storage is watched.

## Before deploying

```
node scripts/db/backupFeatureData.js backups/pre-deploy
```

This writes groups, ingroups, devapikeys, modactions, and each user's `id`/`github`/`contributorTypes` as EJSON. Keep the folder until the deploy is accepted. `backups/` is git-ignored.

## Rollback

1. Turn the features off with the flags above, or roll the code back.
2. Run the down scripts you need, newest first. Each one takes `--dry-run`.
   ```
   node migrations/down/githubLinks.js --confirm        # #36
   node migrations/down/gameEventLog.js --confirm       # #35
   node migrations/down/developerApi.js --confirm --backup backups/pre-deploy   # #34
   ```
3. Restart www. Startup clears the permission cache.

If the code is not rolled back, startup recreates the default groups and permissions. The flags are the way to keep a feature off while its code stays deployed.

## Re-applying after a rollback

1. `node scripts/db/restoreFeatureData.js <backupDir>` restores groups and memberships, developer API keys, mod actions and user GitHub fields. It never deletes anything.
2. If the Dev group should go again, run `node migrations/replaceDevGroupWithDeveloper.js --confirm`.
3. Restart www, then games.

## Cost on prod

- Game log: about 300 bytes per event. A 4-player, 2-phase test game was 106 KB. Expect about 1-5 MB for a normal 10-15 player game, with a hard cap of 32 MB per game. At 75-300 games a day, 7 days is roughly 0.5-10 GB. Writes are one insert per active game every 2 s.
- GitHub sync: one unauthenticated request a day (GitHub allows 60 an hour per IP), plus one `/users/:name` lookup per username change, rate limited to one per user every 10 s.
