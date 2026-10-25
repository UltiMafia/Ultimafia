# Deploy and rollback: ban page and ban appeals

A site-banned user who signs in now sees a full "YOU ARE BANNED" page with the
reason, the ban dates and a one-time appeal form, instead of a snackbar on the
home screen. The appeal goes to an admins-only group DM and to each admin's
inbox. One appeal per person, counting linked (alt) accounts. Site bans need a
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
- **Appeal message.** It goes into the group DM of every admin. The banned
  user is not a member, so they can't read it or the votes. The channel id is
  the one the chat panel uses for that member set, so all appeals share one
  admins-only DM. The message is posted by a site sender
  (`site:ban-appeals`, shown as "Ban Appeals", `modules/siteSender.js`), not
  a user account. `modules/chat.js` renders that sender when it loads
  messages. The text is exactly
  `BAN-APPEAL: <USERNAME> - BAN REASON: <reason> , APPEAL: <text>`.
- **Admin notifications.** Each admin gets the DM opened, an unread chat
  notification, and an inbox notification "Ban appeal pending: <USERNAME>"
  (gavel icon) that links to the mod panel (`/policy/moderation`), where the
  Ban Appeal Tally and Ban Appeal Vote commands are. The chat server and the
  inbox read from Mongo, so admins see both the next time the chat panel or
  notifications load. There's no live push: the www process has no socket to
  the chat server or the clients (`createNotification` only pushes when it is
  given sockets, which www doesn't have).
- **Message length.** Typed chat messages are cut to 240 characters
  (`maxChatMessageLength`, applied in `modules/chat.js` when a user sends).
  The appeal message is written server-side, so that limit doesn't apply, and
  the message is never cut. It is bounded instead: the reason is at most 300
  characters and the appeal 1,000 (`MAX_BAN_REASON_LENGTH`,
  `MAX_APPEAL_LENGTH`, enforced by the server and the form), so a message is
  at most about 1,350 characters. The chat panel wraps it.
- **Once only, per ban.** `sitebanappeals.banId` is unique: one appeal per
  ban, enforced by the database, so even concurrent submits produce one
  appeal.
- **Once only, per person (alts).** A banned account can't appeal if a linked
  account already has an appeal that counts, whatever its status. Instead the
  ban page shows that appeal's status, marked as from a linked account
  (without its text or account name, since a link can be a shared network).
  - **Linked** means the same thing as the mod "Alts" command and the alt
    bans `/mod/ban` already applies (`getAltAccountIds` →
    `modules/accountLinkage.js` `getDirectLinkedAccountIds`): the two
    accounts share at least one IP in `users.ip`, or an identical device
    fingerprint (platform, stable and unstable values) in
    `users.fingerprints`. Links are direct, not chained: if A shares an IP
    with B and B with C, but A and C share nothing, A and C are not linked.
    "Unlink Accounts" removes the shared evidence, and with it the link.
  - **Counts** means the linked appeal's ban is still an active site ban, or
    the appeal was filed after this account's ban was issued. An old appeal
    for a ban that has ended doesn't block appealing a new ban.
  - Enforced on submit (409), and again after saving: if linked accounts
    submit at the same moment, the later one (by time, then id) deletes its
    own appeal and gets 409 before anything is sent.
  - Accepting one linked account's appeal doesn't unban the others. Each
    account's ban is lifted with its own Unban (Site).
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
  - Accepts needed: acceptAt = min(2, N). The appeal becomes ACCEPTED at
    acceptAt accept votes, checked first after each vote.
  - It becomes DENIED once that is out of reach: with D deny votes, DENIED
    when D > N - acceptAt. For example, N = 5 is denied at 4 denies, N = 3 at
    2, N = 2 at 1, and N = 1 at 1 (one admin decides alone either way).
  - With N = 0 (no admins when it was submitted) the appeal is stored as
    PENDING, no DM or notification is sent, and nobody can vote on it (open
    question).
  - To change the cap of 2, edit `ACCEPT_VOTES_REQUIRED` in
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
| `chatchannels` / `chatmessages` / `channelopens` / `notifications` | One admins-only group DM (shared by all appeals), one message per appeal from the site sender (`senderId: "site:ban-appeals"`, no user document), the admins' opens, an unread chat notification and a "Ban appeal pending" inbox notification per admin, plus one tally message per vote (sent by the voting admin). |
| `sessions` with `session.siteBan` | When a site-banned user signs in. Expire with the normal 14-day session TTL. |

No startup migration and no change to existing documents.

## Before deploying

```
node scripts/db/banAppealsBackup.js backups/ban-appeals-pre-deploy
```

It writes `bans.json` (bans with `reason`/`createdAt`, normally none before the
first deploy), `sitebanappeals.json` and `sitemessages.json` (the site
sender's appeal messages).

## Rollback

1. Back up the current state: `node scripts/db/banAppealsBackup.js backups/ban-appeals-pre-rollback`
2. Roll the code back.
3. `node migrations/down/banAppeals.js --dry-run`, then `--confirm`. This
   unsets `bans.reason`/`createdAt`, drops `sitebanappeals` (`--keep-appeals`
   keeps it), deletes ban page sessions and deletes the site sender's appeal
   messages. Do that last one in the same window as the code rollback: the
   old `modules/chat.js` can't load a channel holding a message with no user
   behind it, so the admins' DM would fail to open. Vote messages and inbox
   notifications stay. Bans themselves are untouched.
4. Restart www and the chat server (no game restart needed).

## Re-applying after a rollback

1. Deploy the code again.
2. `node scripts/db/banAppealsRestore.js backups/ban-appeals-pre-rollback`

## Prod impact

- Site bans from the Ban command now fail without a reason. Mods need to fill
  in the new "Reason" field.
- A banned sign-in now creates a small session document (it used to create
  none). Repeated sign-in attempts each add one until the TTL expires.
- The ban page makes 1 query for the ban and a few small ones (user, appeal,
  the linked-account lookup the Alts command uses). An appeal does one group
  lookup, the linked-account lookup twice and a handful of writes.
- `modules/chat.js` changes slightly: it renders the site sender, and a
  message whose sender no longer has a user document shows as "[deleted]"
  instead of failing the whole channel load. Deploy www and chat together. Nothing runs for users
  who aren't banned, beyond one extra `delete req.session.siteBan` on sign-in.
- Clients that only read `siteBanned`/`banExpires` from the 403 still work.
  The response adds `banPage: "/banned"`.
