# Deploy and rollback: ban page and ban appeals

A site-banned user who signs in now sees a full "YOU ARE BANNED" page with the
reason, the ban dates and a one-time appeal form, instead of a snackbar on the
home screen. The appeal goes to a group DM with every admin. Site bans need a
reason.

## How it works

- **Reason.** `/mod/ban` refuses a site ban without a `reason` (1 to 300
  characters) and stores it on the ban (`bans.reason`). Other ban types accept
  an optional reason. A ban from a completed report gets
  `"<violation> (<n> Offense): <decision summary>"` as its reason, since the
  decision summary is already required there.
- **Ban session.** On sign-in, a site-banned account gets
  `req.session.siteBan = { userId, csrf }` and no `req.session.user`. Every
  existing endpoint still sees a signed-out visitor. Only these read the ban
  session:
  - `GET /api/auth/ban`: ban page data (reason, issued/expiry dates, account
    name, appeal status)
  - `POST /api/auth/ban/appeal`: the one appeal (needs the `x-csrf` header
    from `GET /api/auth/ban`)
  - `POST /api/auth/ban/logout`: ends the ban session

  `/api/user/info` answers `{ siteBanned: true }` for a ban session, so the
  client sends the user to `/banned`.
- **Admins.** Members of the `Owner` and `Admin` groups who aren't deleted
  (`APPEAL_RECIPIENT_GROUPS` in `modules/banAppeals.js`). The admin who issued
  the ban is included.
- **Appeal message.** It's sent as the banned user into the group DM of the
  banned user plus every admin, which has the same channel id the chat panel
  uses for that member set. The text is exactly
  `BAN-APPEAL: <USERNAME> - BAN REASON: <reason> , APPEAL: <text>`. Each admin
  gets the DM opened and an unread chat notification. The chat server reads
  the message from Mongo, so an admin sees it the next time the chat panel
  loads (there's no live push from www to the chat process).
- **Once only.** `sitebanappeals.banId` is unique: one appeal per ban, enforced
  by the database, so even concurrent submits produce one appeal. A new ban can
  be appealed again.
- **Voting.** Admins vote with the mod command "Ban Appeal Vote"
  (`POST /mod/banAppeal/vote` with `vote: accept|deny`). The caller needs the
  `unban` permission above the target's rank and must be an admin as defined
  above, so mods can't vote. Each admin has one vote per appeal, stored in
  `sitebanappeals.votes` as `{ voterId, vote, at, notes }`. Voting again
  replaces that admin's earlier vote while the appeal is PENDING.
  - N is the number of admins the appeal was sent to. It's snapshotted at
    submission in `sitebanappeals.recipientIds`, so admins added or removed
    later don't change N. Only those N admins can vote, and they must still
    be admins when they vote.
  - The appeal becomes ACCEPTED at 2 accept votes, checked first after each
    vote.
  - It becomes DENIED once 2 accepts are out of reach: with D deny votes,
    DENIED when D > N - 2. For example, N = 3 is denied at 2 denies, N = 5 at
    4 denies, and N = 2 at 1 deny.
  - With N < 2 the appeal can never reach 2 accepts. It stays PENDING and is
    never auto-denied (open question).
  - To change the accept threshold, edit `ACCEPT_VOTES_REQUIRED` in
    `modules/banAppeals.js`.
  - Once decided, votes are closed (409).
  - Each vote also posts the tally into the appeal's group DM, e.g.
    `BAN-APPEAL VOTE: AdminBob voted ACCEPT - 3 admins: accept 1/2, deny 0/2 - still PENDING`.
  - "Ban Appeal Tally" (`GET /mod/banAppeal?userId=`) shows the status, N,
    the accept and deny counts and who voted what.
  - The banned user sees only the status, not the votes.
  - Mod actions: "Vote On Ban Appeal" for each vote, plus "Accept Ban Appeal"
    / "Deny Ban Appeal" when the appeal is decided.
- **Accepting does not unban.** Lifting the ban is a separate, explicit
  Unban (Site). After that, the ban page says the ban has ended and the user
  can sign in normally.

## What changes in the database

| Change | When it happens |
|--------|-----------------|
| `bans.reason` (String), `bans.createdAt` (Number) | On every new ban. Old bans have neither; the page shows "No reason was recorded for this ban." and the ObjectId time as the ban date. |
| New collection `sitebanappeals` (unique `id`, unique `banId`; `votes` array) | When a banned user appeals, and on each admin vote. Mongoose builds the indexes on startup. |
| `chatchannels` / `chatmessages` / `channelopens` / `notifications` | One group DM, one message and the admins' opens and notifications per appeal, plus one tally message per vote. Same shapes as normal DMs. |
| `sessions` with `session.siteBan` | When a site-banned user signs in. Expire with the normal 14-day session TTL. |

No startup migration and no change to existing documents.

## Before deploying

```
node scripts/db/banAppealsBackup.js backups/ban-appeals-pre-deploy
```

It writes `bans.json` (bans with `reason`/`createdAt`, normally none before the
first deploy) and `sitebanappeals.json`.

## Rollback

1. Back up the current state: `node scripts/db/banAppealsBackup.js backups/ban-appeals-pre-rollback`
2. Roll the code back.
3. `node migrations/down/banAppeals.js --dry-run`, then `--confirm`. This
   unsets `bans.reason`/`createdAt`, drops `sitebanappeals` (`--keep-appeals`
   keeps it) and deletes ban page sessions. Bans themselves are untouched.
   Appeal messages already sent stay in the admins' DMs.
4. Restart www (no game restart needed).

## Re-applying after a rollback

1. Deploy the code again.
2. `node scripts/db/banAppealsRestore.js backups/ban-appeals-pre-rollback`

## Prod impact

- Site bans from the Ban command now fail without a reason. Mods need to fill
  in the new "Reason" field.
- A banned sign-in now creates a small session document (it used to create
  none). Repeated sign-in attempts each add one until the TTL expires.
- The ban page makes 1 query for the ban and 2 small ones (user, appeal). An
  appeal does one group lookup and a handful of writes. Nothing runs for users
  who aren't banned, beyond one extra `delete req.session.siteBan` on sign-in.
- Clients that only read `siteBanned`/`banExpires` from the 403 still work.
  The response adds `banPage: "/banned"`.
