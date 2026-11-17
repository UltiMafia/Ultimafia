# Dialog and overlay pass

Generated 2026-11-14T00:45:53.822Z. Widths: 1440, 390. Theme: dark.

Production route components with synthetic fixtures. This is structural evidence, not visual acceptance.

## Coverage

- Source inventory: **89** dialog/menu/popover usages across **73** files.
- Routes probed: **81**
- Triggers tried: **1097**
- Overlays opened and measured: **144**
- By kind: popover|1440 24, menu|1440 11, dialog|1440 33, drawer|390 14, popover|390 24, menu|390 4, dialog|390 34

The source inventory is the denominator. The trigger scan is generic, so overlays that only open from a row action, a long press or a specific state may be missing. Those are reported as not reached, not as clean.

## Findings

**12** findings (2 high, 10 medium).

| Severity | Width | Route | Trigger | Property | Observed | Common | Detail |
|---|---|---|---|---|---|---|---|
| high | 1440 | `/policy/moderation/tools` | Unban | `overflowX` | 95px | no horizontal overflow | Content is 95px wider than its box inside this dialog. |
| high | 1440 | `/policy/moderation/tools` | Unban | `overflowX` | 90px | no horizontal overflow | Content is 90px wider than its box inside this dialog. |
| medium | 1440 | `/community/forums` | Search | `bodyFontSize` | 12 | 16 | dialog bodyFontSize is 12 against 16 across dialogs. |
| medium | 1440 | `/community/forums/board/fixture-board` | Search | `bodyFontSize` | 12 | 16 | dialog bodyFontSize is 12 against 16 across dialogs. |
| medium | 1440 | `/community/forums/board/fixture-board` | Create Thread | `button.height` | 36, 40 | one action height | Buttons in this dialog have different heights: 36, 40. |
| medium | 1440 | `/community/forums/board/fixture-board` | Create Thread | `button.height` | 28, 44 | one action height | Buttons in this dialog have different heights: 28, 44. |
| medium | 1440 | `/community/forums/thread/fixture-thread-0` | Search | `bodyFontSize` | 12 | 16 | dialog bodyFontSize is 12 against 16 across dialogs. |
| medium | 390 | `/learn/setup/fixture-setup-0` | Host game | `button.height` | 23.19, 44 | one action height | Buttons in this dialog have different heights: 23.19, 44. |
| medium | 1440 | `/user/family/fixture-family` | Emotes and stickers | `titleFontSize` | 16 | 18 | popover titleFontSize is 16 against 18 across popovers. |
| medium | 1440 | `/user/family/fixture-family` | Trade Shares | `bodyFontSize` | 14 | 16 | dialog bodyFontSize is 14 against 16 across dialogs. |
| medium | 1440 | `/user/family/fixture-family` | Trade Shares | `maxWidth` | 444px | 600px | Dialog max-width is 444px; the common frame is 600px. |
| medium | 1440 | `/user/fixture-minimal` | Report user | `bodyFontSize` | 14 | 16 | dialog bodyFontSize is 14 against 16 across dialogs. |

## Value census

**Corner radius** — 3 distinct

| Value | Overlays | Kinds | Examples |
|---|---|---|---|
| 12 | 67 | dialog | Search @ /community/forums; Search @ /community/forums/board/fixture-board; Create Thread @ /community/forums/board/fixture-board |
| 6 | 63 | popover, menu | View setup: Classic @ /play; View role: Villager @ /play; Active @ /audit/new-page |
| 16 | 14 | drawer | View setup: Classic @ /play; View setup: Classic @ /play/host?game=Mafia; Preview Harbor residents @ /play/decks?game=Mafia |

**Title size** — 3 distinct

| Value | Overlays | Kinds | Examples |
|---|---|---|---|
| 20 | 67 | dialog | Search @ /community/forums; Search @ /community/forums/board/fixture-board; Create Thread @ /community/forums/board/fixture-board |
| 18 | 44 | popover, drawer | View setup: Classic @ /play; View role: Villager @ /play; View role: Villager @ /play/create?game=Mafia&copy=fixture-setup-0 |
| 16 | 6 | popover | Emotes and stickers @ /user/family/fixture-family; Emotes and stickers @ /user/family/fixture-family; Emotes and stickers @ /user/family/fixture-family |

**Body size** — 3 distinct

| Value | Overlays | Kinds | Examples |
|---|---|---|---|
| 16 | 113 | popover, menu, dialog, drawer | View setup: Classic @ /play; View role: Villager @ /play; Active @ /audit/new-page |
| 12 | 6 | dialog | Search @ /community/forums; Search @ /community/forums/board/fixture-board; Search @ /community/forums/thread/fixture-thread-0 |
| 14 | 4 | dialog | Report user @ /user/fixture-minimal; Trade Shares @ /user/family/fixture-family; Report user @ /user/fixture-minimal |

**Dialog max-width** — 6 distinct

| Value | Overlays | Kinds | Examples |
|---|---|---|---|
| 600px | 65 | dialog | Search @ /community/forums; Search @ /community/forums/board/fixture-board; Create Thread @ /community/forums/board/fixture-board |
| calc(100% - 32px) | 57 | popover, menu | View setup: Classic @ /play; View role: Villager @ /play; Active @ /audit/new-page |
| none | 14 | drawer | View setup: Classic @ /play; View setup: Classic @ /play/host?game=Mafia; Preview Harbor residents @ /play/decks?game=Mafia |
| 1408px | 3 | popover | Emotes and stickers @ /user/family/fixture-family; Emotes and stickers @ /user/family/fixture-family; Emotes and stickers @ /user/family/fixture-family |
| 358px | 3 | popover | Emotes and stickers @ /user/family/fixture-family; Emotes and stickers @ /user/family/fixture-family; Emotes and stickers @ /user/family/fixture-family |
| 444px | 2 | dialog | Trade Shares @ /user/family/fixture-family; Trade Shares @ /user/family/fixture-family |

**Action heights** — 9 distinct

| Value | Overlays | Kinds | Examples |
|---|---|---|---|
| 40 | 36 | dialog | Search @ /community/forums; Search @ /community/forums/board/fixture-board; Create Thread @ /community/forums/board/fixture-board |
| 44 | 31 | dialog | Host game @ /learn/setup/fixture-setup-0; Create Thread @ /community/forums/board/fixture-board; Report user @ /user/fixture-minimal |
| 20.29 | 3 | popover | Emotes and stickers @ /user/family/fixture-family; Emotes and stickers @ /user/family/fixture-family; Emotes and stickers @ /user/family/fixture-family |
| 36 | 1 | dialog | Create Thread @ /community/forums/board/fixture-board |
| 34.31 | 1 | popover | Emotes and stickers @ /user/family/fixture-family |
| 19.59 | 1 | popover | Emotes and stickers @ /user/family/fixture-family |
| 23.19 | 1 | dialog | Host game @ /learn/setup/fixture-setup-0 |
| 28 | 1 | dialog | Create Thread @ /community/forums/board/fixture-board |
| 32.73 | 1 | popover | Emotes and stickers @ /user/family/fixture-family |

## Where no overlay was reached

96 of 162 route/width probes opened no measured overlay. This can mean the page has none, or that the trigger is a row action, long press or other state the generic scan cannot reach. These are unverified, not clean.

- `/community/users` (1440px) — 4 triggers tried
- `/community/families` (1440px) — 0 triggers tried
- `/play/host?game=Mafia` (1440px) — 10 triggers tried
- `/play/createDeck?game=Mafia&edit=fixture-deck-0` (1440px) — 9 triggers tried
- `/play/wordDecks?game=Mafia` (1440px) — 10 triggers tried
- `/play/createWordDeck?game=Mafia&edit=fixture-word-0` (1440px) — 1 triggers tried
- `/learn/glossary` (1440px) — 2 triggers tried
- `/learn/role/Cop` (1440px) — 10 triggers tried
- `/user/fixture-default` (1440px) — 10 triggers tried
- `/user/fixture-person-0` (1440px) — 10 triggers tried
- `/user/fixture-person-1` (1440px) — 10 triggers tried
- `/user/settings/account` (1440px) — 2 triggers tried
- `/user/settings/github` (1440px) — 0 triggers tried
- `/user/settings/cookies` (1440px) — 2 triggers tried
- `/user/settings/family` (1440px) — 0 triggers tried
- `/user/shop` (1440px) — 3 triggers tried
- `/user/notifications` (1440px) — 10 triggers tried
- `/fame/stocks` (1440px) — 10 triggers tried
- `/activity/metrics` (1440px) — 3 triggers tried
- `/activity/livefeed` (1440px) — 10 triggers tried
- `/policy/rules` (1440px) — 3 triggers tried
- `/policy/tos` (1440px) — 0 triggers tried
- `/policy/privacy` (1440px) — 0 triggers tried
- `/policy/invoices` (1440px) — 10 triggers tried
- `/policy/moderation/handbook` (1440px) — 0 triggers tried
- `/policy/moderation/github-links` (1440px) — 9 triggers tried
- `/policy/moderation` (1440px) — 5 triggers tried
- `/policy/moderation/reports` (1440px) — 1 triggers tried
- `/policy/moderation/github-links` (1440px) — 9 triggers tried
- `/policy/moderation/volunteer` (1440px) — 0 triggers tried
- `/policy/moderation/competitive` (1440px) — 10 triggers tried
- `/policy/moderation/ban-appeals` (1440px) — 3 triggers tried
- `/policy/moderation/ban-appeals/case1` (1440px) — 0 triggers tried
- `/auth/login` (1440px) — 7 triggers tried
- `/welcome` (1440px) — 7 triggers tried
- `/community/feedback` (1440px) — 0 triggers tried
- `/community/feedback` (1440px) — 0 triggers tried
- `/fame/contributors` (1440px) — 1 triggers tried
- `/fame/donors` (1440px) — 1 triggers tried
- `/fame/competitive/faq` (1440px) — 0 triggers tried

## Overlays opened

| Route | Trigger | Kind | Title | Width × height | Radius | Fields | Actions |
|---|---|---|---|---|---|---|---|
| `/play` | View setup: Classic | popover | Classic | 240.97 × 278.5 | 6 | 0 | no |
| `/play` | View role: Villager | popover | Villager | 365.76 × 90.45 | 6 | 0 | no |
| `/audit/new-page` | Active | menu |  | 623.2 × 31.32 | 6 | 0 | no |
| `/play/create?game=Mafia&copy=fixture-setup-0` | View role: Villager | popover | Villager | 376.95 × 96.84 | 6 | 0 | no |
| `/play/decks?game=Mafia` | Preview Harbor residents | popover | Harbor residents | 241.3 × 168.32 | 6 | 0 | no |
| `/learn/games` | View role: Villager | popover | Villager | 376.98 × 96.86 | 6 | 0 | no |
| `/learn/setup/fixture-setup-0` | View role: Villager | popover | Villager | 484 × 158 | 6 | 0 | no |
| `/community/forums` | Search | dialog | Search Forums | 600 × 405.91 | 12 | 3 | yes |
| `/community/forums/board/fixture-board` | Search | dialog | Search Forums | 600 × 405.91 | 12 | 3 | yes |
| `/community/forums/board/fixture-board` | Create Thread | dialog | Create Thread | 600 × 593 | 12 | 4 | yes |
| `/community/forums/thread/fixture-thread-0` | Search | dialog | Search Forums | 600 × 405.91 | 12 | 3 | yes |
| `/user/fixture-minimal` | Report user | dialog | Report user | 600 × 475 | 12 | 5 | yes |
| `/user/fixture-custom` | View setup: Classic | popover | Classic | 240.97 × 278.52 | 6 | 0 | no |
| `/user/fixture-custom` | View role: Villager | popover | Villager | 365.75 × 90.45 | 6 | 0 | no |
| `/user/settings/site` | Site Color Scheme | menu |  | 363.1 × 72.3 | 6 | 0 | no |
| `/user/settings/site` | Minimum WCAG contrast | menu |  | 363.12 × 72.31 | 6 | 0 | no |
| `/user/settings/site` | Font size | menu |  | 362.42 × 113.12 | 6 | 0 | no |
| `/user/settings/site` | Font | menu |  | 362.69 × 92.72 | 6 | 0 | no |
| `/user/settings/profile` | Banner Format | menu |  | 363.68 × 51.83 | 6 | 0 | no |
| `/user/settings/profile` | Avatar shape | menu |  | 363.67 × 51.83 | 6 | 0 | no |
| `/user/settings/game` | In-game Avatar Shape | menu |  | 363.66 × 51.82 | 6 | 0 | no |
| `/user/settings/game` |  | popover |  | 226.21 × 169.73 | 6 | 2 | no |
| `/user/settings/game` |  | popover |  | 226.21 × 169.73 | 6 | 2 | no |
| `/fame/hall-of-fame` | All Time | menu |  | 169.46 × 31.31 | 6 | 0 | no |
| `/fame/hall-of-fame` | 25 | menu |  | 168.5 × 92.72 | 6 | 0 | no |
| `/fame/competitive` | View setup: Classic | popover | Classic | 240.96 × 278.48 | 6 | 0 | no |
| `/fame/competitive` | View role: Villager | popover | Villager | 365.74 × 90.44 | 6 | 0 | no |
| `/user/developer` | Revoke | dialog | Revoke key | 600 × 199 | 12 | 0 | yes |
| `/user/developer` | Revoke | dialog | Revoke key | 600 × 199 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Ban user | dialog | Permanently ban user? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Ban user | dialog | Permanently ban user? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Ban user | dialog | Permanently ban user? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Approve user | dialog | Approve user? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Approve user | dialog | Approve user? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Approve user | dialog | Approve user? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/tools` | Ban Appeal Tally | dialog | Ban Appeal Tally | 600 × 199 | 12 | 1 | yes |
| `/policy/moderation/tools` | Ban Appeal Vote | dialog | Ban Appeal Vote | 600 × 263 | 12 | 3 | yes |
| `/policy/moderation/tools` | Review GitHub Link | dialog | Review GitHub Link | 600 × 263 | 12 | 3 | yes |
| `/policy/moderation/tools` | Unban | dialog | Unban | 600 × 279 | 12 | 3 | yes |
| `/policy/moderation/tools` | Add User to Group | dialog | Add User to Group | 600 × 199 | 12 | 2 | yes |
| `/policy/moderation/tools` | Remove User from Group | dialog | Remove User from Group | 600 × 199 | 12 | 2 | yes |
| `/policy/moderation/groups` | Add user to Owner | dialog | Add user to Owner | 600 × 191 | 12 | 1 | yes |
| `/policy/moderation/groups` | Remove NightOwl from Owner | dialog | Remove group member? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/groups` | Add user to Admin | dialog | Add user to Admin | 600 × 191 | 12 | 1 | yes |
| `/policy/moderation/groups` | Remove NightOwl from Admin | dialog | Remove group member? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/groups` | Remove Juniper from Admin | dialog | Remove group member? | 600 × 175 | 12 | 0 | yes |
| `/policy/moderation/groups` | Add user to Moderator | dialog | Add user to Moderator | 600 × 191 | 12 | 1 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 600 × 175 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 600 × 175 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 600 × 175 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 600 × 175 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 600 × 175 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 600 × 175 | 12 | 0 | yes |
| `/play/tutorial` | View role: Cop | popover | Cop | 497.99 × 90.44 | 6 | 0 | no |
| `/user/family/fixture-family` | Trade Shares | dialog | Trade shares | 444 × 593.17 | 12 | 1 | yes |
| `/user/family/fixture-family` | Pay Fee and Apply | dialog | Apply to family? | 600 × 199 | 12 | 0 | yes |
| `/user/family/fixture-family` | Emotes and stickers | popover | Frequently Used | 318.97 × 466.86 | 6 | 1 | no |
| `/user/family/fixture-family` | Emotes and stickers | popover | Frequently Used | 244.69 × 276.15 | 6 | 1 | no |
| `/user/family/fixture-family` | Emotes and stickers | popover | Frequently Used | 240.99 × 266.64 | 6 | 1 | no |
| `/play/create?game=Mafia` | View role: Villager | popover | Villager | 376.98 × 96.86 | 6 | 0 | no |
| `/play/create?game=Mafia` | View role: Accountant | popover | Accountant | 589.42 × 90.44 | 6 | 0 | no |
| `/play/create?game=Acrotopia` | View role: Villager | popover | Villager | 376.99 × 96.86 | 6 | 0 | no |
| `/play/create?game=Liars%20Dice` |  | popover |  | 443.52 × 63.77 | 6 | 0 | no |
| `/play/create?game=Texas%20Hold%20Em` |  | popover |  | 443.52 × 63.77 | 6 | 0 | no |
| `/play/create?game=Cheat` |  | popover |  | 443.48 × 63.76 | 6 | 0 | no |
| `/play/create?game=Ratscrew` |  | popover |  | 443.48 × 63.76 | 6 | 0 | no |
| `/play/create?game=Dice%20Wars` | Max Dice Per Territory | menu |  | 434.22 × 72.31 | 6 | 0 | no |
| `/play/create?game=Chess` |  | popover |  | 443.5 × 63.76 | 6 | 0 | no |
| `/play` | View setup: Classic | drawer | Classic | 390 × 516.5 | 16 | 0 | no |
| `/play` | View role: Villager | popover | Villager | 270.39 × 104.06 | 6 | 0 | no |
| `/audit/new-page` | Active | menu |  | 277.76 × 38.15 | 6 | 0 | no |
| `/play/host?game=Mafia` | View setup: Classic | drawer | Classic | 390 × 516.5 | 16 | 0 | no |
| `/play/host?game=Mafia` | View role: Villager | popover | Villager | 270.39 × 104.05 | 6 | 0 | no |
| `/play/create?game=Mafia&copy=fixture-setup-0` | View role: Villager | popover | Villager | 294.91 × 125.88 | 6 | 0 | no |
| `/play/create?game=Mafia&copy=fixture-setup-0` | View role: Accountant | popover | Accountant | 270.28 × 117.67 | 6 | 0 | no |
| `/play/create?game=Mafia&copy=fixture-setup-0` | View role: Admiral | popover | Admiral | 269.33 × 415.87 | 6 | 0 | no |
| `/play/decks?game=Mafia` | Preview Harbor residents | drawer | Harbor residents | 390 × 321.5 | 16 | 0 | no |
| `/play/decks?game=Mafia` | Preview Library visitors | drawer | Library visitors | 390 × 321.5 | 16 | 0 | no |
| `/play/decks?game=Mafia` | Preview Forest travelers | drawer | Forest travelers | 390 × 321.5 | 16 | 0 | no |
| `/play/decks?game=Mafia` | Harbor residents | drawer | Harbor residents | 390 × 321.5 | 16 | 0 | no |
| `/play/decks?game=Mafia` | Library visitors | drawer | Library visitors | 390 × 321.5 | 16 | 0 | no |
| `/play/decks?game=Mafia` | Forest travelers | drawer | Forest travelers | 390 × 321.5 | 16 | 0 | no |
| `/learn/games` | View role: Villager | popover | Villager | 278.02 × 110.85 | 6 | 0 | no |
| `/learn/role/Cop` | View role: Cop | popover | Cop | 270.26 × 117.65 | 6 | 0 | no |
| `/learn/setup/fixture-setup-0` | View role: Villager | popover | Villager | 358 × 182 | 6 | 0 | no |
| `/learn/setup/fixture-setup-0` | View role: Cop | popover | Cop | 358 × 206 | 6 | 0 | no |
| `/learn/setup/fixture-setup-0` | View role: Doctor | popover | Doctor | 358 × 214 | 6 | 0 | no |
| `/learn/setup/fixture-setup-0` | View role: Mafioso | popover | Mafioso | 318 × 158 | 6 | 0 | no |
| `/learn/setup/fixture-setup-0` | Host game | dialog | Host a game | 326 × 812 | 12 | 12 | yes |
| `/community/forums` | Search | dialog | Search Forums | 326 × 401.91 | 12 | 3 | yes |
| `/community/forums/board/fixture-board` | Search | dialog | Search Forums | 326 × 401.91 | 12 | 3 | yes |
| `/community/forums/board/fixture-board` | Create Thread | dialog | Create Thread | 326 × 641 | 12 | 4 | yes |
| `/community/forums/thread/fixture-thread-0` | Search | dialog | Search Forums | 326 × 401.91 | 12 | 3 | yes |
| `/user/fixture-minimal` | Report user | dialog | Report user | 326 × 516 | 12 | 5 | yes |
| `/user/fixture-default` | View setup: Classic | drawer | Classic | 390 × 516.5 | 16 | 0 | no |
| `/user/fixture-person-0` | View setup: Classic | drawer | Classic | 390 × 516.5 | 16 | 0 | no |
| `/user/fixture-person-1` | View setup: Classic | drawer | Classic | 390 × 516.5 | 16 | 0 | no |
| `/user/fixture-custom` | View setup: Classic | drawer | Classic | 390 × 516.5 | 16 | 0 | no |
| `/user/fixture-custom` | View role: Villager | popover | Villager | 270.39 × 104.06 | 6 | 0 | no |
| `/fame/hall-of-fame` | All Time | menu |  | 253.46 × 38.15 | 6 | 0 | no |
| `/fame/competitive` | View setup: Classic | drawer | Classic | 390 × 516.5 | 16 | 0 | no |
| `/fame/stocks` | Name | menu |  | 90.48 × 174.25 | 6 | 0 | no |
| `/policy/invoices` | All | menu |  | 86.67 × 201.39 | 6 | 0 | no |
| `/user/developer` | Revoke | dialog | Revoke key | 326 × 231 | 12 | 0 | yes |
| `/user/developer` | Revoke | dialog | Revoke key | 326 × 231 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Ban user | dialog | Permanently ban user? | 326 × 259 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Ban user | dialog | Permanently ban user? | 326 × 259 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Ban user | dialog | Permanently ban user? | 326 × 259 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Approve user | dialog | Approve user? | 326 × 207 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Approve user | dialog | Approve user? | 326 × 207 | 12 | 0 | yes |
| `/policy/moderation/flagged-intake` | Approve user | dialog | Approve user? | 326 × 207 | 12 | 0 | yes |
| `/policy/moderation/tools` | Ban Appeal Tally | dialog | Ban Appeal Tally | 326 × 211 | 12 | 1 | yes |
| `/policy/moderation/tools` | Ban Appeal Vote | dialog | Ban Appeal Vote | 326 × 315 | 12 | 3 | yes |
| `/policy/moderation/tools` | Review GitHub Link | dialog | Review GitHub Link | 326 × 315 | 12 | 3 | yes |
| `/policy/moderation/tools` | Unban | dialog | Unban | 326 × 315 | 12 | 3 | yes |
| `/policy/moderation/tools` | Add User to Group | dialog | Add User to Group | 326 × 263 | 12 | 2 | yes |
| `/policy/moderation/tools` | Remove User from Group | dialog | Remove User from Group | 326 × 263 | 12 | 2 | yes |
| `/policy/moderation/groups` | Add user to Owner | dialog | Add user to Owner | 326 × 203 | 12 | 1 | yes |
| `/policy/moderation/groups` | Remove NightOwl from Owner | dialog | Remove group member? | 326 × 183 | 12 | 0 | yes |
| `/policy/moderation/groups` | Add user to Admin | dialog | Add user to Admin | 326 × 203 | 12 | 1 | yes |
| `/policy/moderation/groups` | Remove NightOwl from Admin | dialog | Remove group member? | 326 × 183 | 12 | 0 | yes |
| `/policy/moderation/groups` | Remove Juniper from Admin | dialog | Remove group member? | 326 × 183 | 12 | 0 | yes |
| `/policy/moderation/groups` | Add user to Moderator | dialog | Add user to Moderator | 326 × 203 | 12 | 1 | yes |
| `/policy/moderation/competitive` | View setup: Classic | drawer | Classic | 390 × 516.5 | 16 | 0 | no |
| `/policy/moderation/competitive` | View role: Villager | popover | Villager | 270.39 × 104.05 | 6 | 0 | no |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 326 × 183 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 326 × 183 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 326 × 183 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 326 × 183 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 326 × 183 | 12 | 0 | yes |
| `/fame/donors` | Remove status | dialog | Remove donor status? | 326 × 183 | 12 | 0 | yes |
| `/user/family/fixture-family` | Trade Shares | dialog | Trade shares | 326 × 617.97 | 12 | 1 | yes |
| `/user/family/fixture-family` | Pay Fee and Apply | dialog | Apply to family? | 326 × 255 | 12 | 0 | yes |
| `/user/family/fixture-family` | Emotes and stickers | popover | Frequently Used | 310.6 × 445.37 | 6 | 1 | no |
| `/user/family/fixture-family` | Emotes and stickers | popover | Frequently Used | 244.68 × 276.11 | 6 | 1 | no |
| `/user/family/fixture-family` | Emotes and stickers | popover | Frequently Used | 244.68 × 276.11 | 6 | 1 | no |
| `/play/create?game=Mafia` | View role: Villager | popover | Villager | 278.03 × 110.85 | 6 | 0 | no |
| `/play/create?game=Mafia` | View role: Accountant | popover | Accountant | 270.28 × 117.67 | 6 | 0 | no |
| `/play/create?game=Acrotopia` | View role: Villager | popover | Villager | 278 × 110.83 | 6 | 0 | no |
| `/play/create?game=Liars%20Dice` |  | popover |  | 270.74 × 77.42 | 6 | 0 | no |
| `/play/create?game=Ratscrew` |  | popover |  | 270.74 × 77.42 | 6 | 0 | no |
| `/play/create?game=Connect%20Four` |  | popover |  | 322.06 × 111.28 | 6 | 0 | no |
| `/play/create?game=Connect%20Four` |  | popover |  | 270.4 × 104.64 | 6 | 0 | no |
| `/play/create?game=Chess` |  | popover |  | 270.71 × 77.4 | 6 | 0 | no |

## Triggers that did not produce a measured overlay

- `/fame/hall-of-fame` — Loot: trigger navigated
- `/policy/moderation/reports` — Open report: trigger navigated
- `/policy/moderation/reports` — Open report: trigger navigated
