# UltiMafia UI inventory

This is the review inventory for the client surfaces. Route captures use the
controlled production-component fixture with the full Mafia role list (443 roles)
and the populated local data where noted. Every route is captured at 1440, 390
and 320 in both dark and light palettes; interaction cases add dialog and state
captures. The full run is the source of the 500+ screenshots.

## Route surfaces

| Surface | Route |
| --- | --- |
| `players` | `/community/users` |
| `families` | `/community/families` |
| `host` | `/play/host?game=Mafia` |
| `create-setup` | `/play/create?game=Mafia&copy=fixture-setup-0` |
| `character-decks` | `/play/decks?game=Mafia` |
| `character-deck-editor` | `/play/createDeck?game=Mafia&edit=fixture-deck-0` |
| `word-decks` | `/play/wordDecks?game=Mafia` |
| `word-deck-editor` | `/play/createWordDeck?game=Mafia&edit=fixture-word-0` |
| `learn-games` | `/learn/games` |
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

- Dark and light palettes; desktop 1440, phone 390, narrow phone 320.
- Loading, empty, error/failure and permission states for the routes that expose them.
- Dialogs: host, avatar crop, banner crop, report, trade, leave game, deck delete, family role/removal/bio, moderation command, group removal, ban confirmation, strategy editor, image viewer.
- Popovers: setup details, game details, player miniprofile, emote/reaction voters, account menu.

## Evidence

- Final route runs: `final8-routes-dark/` and `final8-routes-light/`.
- Game workspace: `final7-game/` or the latest game layout run.
- Controls, competitive, ban appeals, lifecycle and homepage suites: see `VERIFICATION.md`.
- Live-site captures: `final7-live/` / `final8-live/` (comment card, family, handbook, setup editor, stock market, shop, game card Details).
