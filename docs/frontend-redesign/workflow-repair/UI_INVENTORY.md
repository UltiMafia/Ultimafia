# UltiMafia UI inventory

This is the review inventory, **not a statement of completed coverage**. Route
fixtures use production components with controlled records and the full Mafia
role list (443 roles). Live existing-database evidence is labeled separately.
The comparative matrix is `../audit/coverage.json`; its denominator is each
registered route/state × 1440/390/320 × dark/light. A successful route capture is
not proof that every dialog, loading/empty/failure or permission branch is covered.
Missing master evidence remains a gap. Screenshot counts do not establish scope.

Machine IDs are `<surface>.<state>`; each table row below has a `.default` state.
Additional registered interaction states are in
`react_main/test/ui-audit/report.cjs`. The fixture-only `new-page-contract.default`
at `/audit/new-page` verifies composition without page-specific CSS. The global
and workflow lists below still require complete stable-ID registration and
capture tasks before the inventory can be called exhaustive.

The registry currently contains **153 route/state IDs × six cells = 918 cells**.
The setup/tab expansion adds setup `modifiers`/`settings`, Learn `keyboard-last`
and the fixture's `steps-final`/`tabs-last`. Final setup tasks pass all six cases
per branch. Its scoped aggregate pairs 18 cells / 900 gaps and retains 60 open
clipping candidates. The initial master selector failures and settled selected-tab
failure are retained diagnostics; the shared tab repair passes six Learn and six
composition cases with strict keyboard/label assertions.
The Learn integration run covered all **852 then-registered pairs**, with no gaps and
856 pre-classification geometry candidates (94 heading offsets, 762 clipping).
It predates the final Learn commit and is not final-HEAD evidence. Registered
coverage is not exhaustive global/game-state inventory completion. The corrected
tab-classification run pairs 120 cells, retaining 628 intentional findings and
34 open findings; its other 732 cells remain gaps in that focused report, not
silently reused evidence. Intentional findings remain visible with their reason.
The focused report-dialog/composition run pairs 48 cells in the expanded 888-cell
registry. Its other 840 cells remain gaps. The recovered integrated report pairs
all 888 then-registered cells: 856 total findings, 628 intentional and 228 open
(94 heading offsets, 134 clipping). Its first attempt left 18 gaps from one
transient tab-scroll failure; a rerun with the exact same production-bundle hashes
fills those cells, while preserving the original diagnostics and input provenance.
This is not final-HEAD evidence or exhaustive state registration.

## Route surfaces

| Surface | Route |
| --- | --- |
| `lobby` | `/play` (populated games, community wall and homepage features) |
| `players` | `/community/users` |
| `families` | `/community/families` |
| `host` | `/play/host?game=Mafia` |
| `create-setup` | `/play/create?game=Mafia&copy=fixture-setup-0` |
| `character-decks` | `/play/decks?game=Mafia` |
| `character-deck-editor` | `/play/createDeck?game=Mafia&edit=fixture-deck-0` |
| `word-decks` | `/play/wordDecks?game=Mafia` |
| `word-deck-editor` | `/play/createWordDeck?game=Mafia&edit=fixture-word-0` |
| `learn-games` | `/learn/games` |
| `glossary` | `/learn/glossary` |
| `role-detail` | `/learn/role/Cop` |
| `setup-detail` | `/learn/setup/fixture-setup-0` |
| `forum-categories` | `/community/forums` |
| `forum-board` | `/community/forums/board/fixture-board` |
| `forum-thread` | `/community/forums/thread/fixture-thread-0` |
| `profile-minimal` | `/user/fixture-minimal` |
| `profile-default` | `/user/fixture-default` |
| `profile-self` | `/user/fixture-person-0` |
| `profile-rich` | `/user/fixture-person-1` |
| `profile-custom` | `/user/fixture-custom` |
| `settings-site` | `/user/settings/site` |
| `settings-profile` | `/user/settings/profile` |
| `settings-game` | `/user/settings/game` |
| `settings-account` | `/user/settings/account` |
| `settings-github` | `/user/settings/github` |
| `settings-cookies` | `/user/settings/cookies` |
| `settings-family` | `/user/settings/family` |
| `shop` | `/user/shop` |
| `notifications` | `/user/notifications` |
| `rankings` | `/fame/hall-of-fame` |
| `competitive` | `/fame/competitive` |
| `stocks` | `/fame/stocks` |
| `activity-metrics` | `/activity/metrics` |
| `activity-feed` | `/activity/livefeed` |
| `rules` | `/policy/rules` |
| `terms` | `/policy/tos` |
| `privacy` | `/policy/privacy` |
| `invoices` | `/policy/invoices` (owner; synthetic records, no payment actions) |
| `invoices-denied` | `/policy/invoices` (ordinary member; actual permission redirect) |
| `developer` | `/user/developer` (developer; public fixture identifiers only) |
| `developer-owner` | `/user/developer` (owner directory variant) |
| `developer-denied` | `/user/developer` (ordinary member) |
| `staff-handbook` | `/policy/moderation/handbook` |
| `admin-github` | `/policy/moderation/github-links` |
| `admin-intake` | `/policy/moderation/flagged-intake` |
| `moderation-log` | `/policy/moderation` |
| `moderation-tools` | `/policy/moderation/tools` |
| `moderation-groups` | `/policy/moderation/groups` |
| `moderation-reports` | `/policy/moderation/reports` |
| `moderation-github` | `/policy/moderation/github-links` |
| `moderation-volunteer` | `/policy/moderation/volunteer` |
| `moderation-competitive` | `/policy/moderation/competitive` |
| `moderation-ban-appeals` | `/policy/moderation/ban-appeals` |
| `moderation-ban-case` | `/policy/moderation/ban-appeals/case1` |
| `authentication` | `/auth/login` |
| `welcome` | `/welcome` (guest) |
| `feedback` | `/community/feedback` |
| `feedback-guest` | `/community/feedback` |
| `contributors` | `/fame/contributors` |
| `donors` | `/fame/donors` |
| `donors-management` | `/fame/donors` |
| `competitive-faq` | `/fame/competitive/faq` |
| `tutorial` | `/play/tutorial` |
| `family-profile` | `/user/family/fixture-family` |
| `family-leader` | `/user/family/fixture-family-leader` |
| `tutorial-failure` | `/play/tutorial?fixtureFailRead=/api/game/tutorial/storylines` |
| `contributors-failure` | `/fame/contributors?fixtureFailRead=/api/site/contributors` |
| `family-failure` | `/user/family/fixture-family?fixtureFailRead=/api/family/fixture-family/profile` |
| `family-pending` | `/user/family/fixture-family-pending` |
| `family-applications-failure` | `/user/family/fixture-family-leader?fixtureFailRead=/api/family/fixture-family-leader/applications` |
| `family-history-failure` | `/user/family/fixture-family?fixtureFailRead=/api/family/fixture-family/ledger` |

## Global shell and overlays

- Header: logo/seasonal variants, account menu, notifications, DMs, hearts, coins.
- Sidebar: Games, Community, Players, Learn, Rankings; Play (Host, Create setup, Competitive, Stock market); More (Families, Feedback, Activity, Metrics, Contributors, Donors, Character decks, Word decks, Moderation); Tutorial, Glossary, Rules.
- Mobile header, mobile bottom navigation, mobile menu, cookie consent.
- Footer, alerts, confirmation dialogs, popovers, sheets, image viewer, emote picker.

## Lobby and play

- Lobby: Games/More tabs, lobby filter, status filters, search, refresh, game cards, empty lobby, community wall comments, featured setup, poll, forum activity, recent trades, stamp exchange.
- Host: setup discovery, filters, details popover, host dialog (Game and lobby, Access and options, Timing), empty/error states.
- Create setup: name, role picker with all 443 roles, selected role sets, add role set, role modifiers, game settings, phone summary/actions, save/cancel.
- Character decks and word decks: library, empty state, editor, cover upload, deck rows, phone editor.
- Game: pregame/live/review, desktop top bar, phase switcher, player list, transcript, actions, vote rows, inventory, last will, pinned messages, notes, settings, mobile menu/info, leave dialog, rehost.

## Community and people

- Forums: categories, board directory, pinned threads, thread posts/replies, reply editor, search, create thread.
- Players directory, player search, profile pages (default, self, rich, custom background, minimal), comments, recent games, setups, friends, collection, ratings, media, stock.
- Families: profile, leader view, pending application, applications, treasury, stock/equity, progress, perks, join fee, ledger, member menu, role/removal/bio confirmations, family discovery.
- Feedback: signed-in and guest, type/category selects, draft retention, submission error.
- Contributors/donors, donor management, activity feed, metrics, rankings, competitive pages, stock market (player/family, portfolio, transactions, IPO), shop (Shop/Donate/Transfer, product cards, purchase dialogs).

## Learn, policy and account

- Learn games, role detail (skins, examples, special interactions, votes, favorite), setup detail (Overview, Statistics, Night actions, Version history, host dialog, description edit, comments, strategies), tutorial.
- Policy: rules, terms, privacy, staff handbook, moderation recent actions, run action, staff groups, reports, GitHub links, flagged intake, volunteer, competitive management, ban appeals list/case.
- Account: login/register, settings site/profile/game/account/GitHub/cookies/family, notifications, shop, welcome.

## States and interaction captures

- Registered acknowledgement states: `contributors.bio-editor`,
  `donors.bio-editor`, `donors-management.assign-dialog` and
  `donors-management.remove-confirmation`. Upstream's assignment popover and
  immediate-removal ancestor are explicitly distinguished from the redesign's
  cancellable dialogs; no donor-group mutations are performed.
- Registered developer and owner-directory states: `revoke-confirmation`,
  `revoke-pending`, `revoke-error`, `create-pending`, `create-error`, `loading`,
  `read-error`, `empty`. Creation/revocation attempts are deliberately deferred
  **failures in the in-memory adapter only**; no credential is generated or used.
- Registered invoice states: `approve-confirmation`, `reject-confirmation`,
  `review-pending`, `review-error`, `loading`, `read-error`, `empty`. Cancellation
  issues no write; the only review attempt is a deferred in-memory failure, never
  a successful payment/credit. Eligibility and the Unpaid filter follow the
  literals in `modules/cryptoPayments.js`, checked without importing that module.
  Upstream native prompts are recorded/dismissed and their actual table ancestors
  are labeled as such, not represented as screenshots of native browser chrome.
- Registered Rules states: `appeal`, `other-policies`, `loading`, `read-error`,
  `empty`. The real violations read is deferred/failed/emptied in both branches;
  master ancestors remain master UI, including its blank loading body. Repaired
  Rules keeps static policy text readable while penalty data is unavailable.
  Canonical text for all 17 sections is guarded separately from presentation.
- Registered profile reporting states: `report-form`, `report-loading`,
  `report-read-error`, `report-empty`, `report-pending`, `report-error` under
  `profile-default`. The pending and inline-error master pairs explicitly use its
  actual populated form ancestor, without sending a report. AFTER simulates only
  a deferred in-memory failure and asserts the existing payload and duplicate
  guard. Complete global/miniprofile/menu coverage remains to be registered.
- Learn registration includes all five Mafia alignments, role search/no results,
  modifiers (Items/Visits/Appearance/Chat/Other), items, mechanics
  (Standard/Voting/Timer/Other), and achievements. Fixtures use public source
  records for all 165 modifiers, 33 game settings, 35 items and 83 achievements,
  not the previous two-modifier/one-setting/empty-item demonstration lists.
  Non-Mafia game-specific reference variants still need explicit registration.
- Dark and light palettes; desktop 1440, phone 390, narrow phone 320.
- Loading, empty, error/failure and permission states for the routes that expose them.
- Dialogs: host, avatar crop, banner crop, report, trade, leave game, deck delete, family role/removal/bio, moderation command, group removal, ban confirmation, strategy editor, image viewer.
- Popovers: setup details, game details, player miniprofile, emote/reaction voters, account menu.

## Evidence

- Current comparative runs and open gaps: `../audit/report.html` and
  `../audit/coverage.json`. The first measured before run has 64 routes × 3 widths
  × 2 palettes, plus task captures. Later runs include the new-page fixture.
- Master controlled-data captures import actual `origin/master` Main and route
  components. They are not authenticated journeys or live-data comparisons.
- `final8-routes-*`, `final7-*` and previous numbered folders are historical
  evidence, not final-HEAD verification of this audit.
- Current exact commands/results and still-unverified suites belong in
  `VERIFICATION.md`; do not infer completion from a folder called `final`.
