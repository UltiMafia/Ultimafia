# Frontend redesign — rejected first pass

**The first implementation below was rejected.** The latest workflow corrections
(consistent homepage right-column panels, players/families, hosting/setup/deck
creation, profile/stock/leaderboard/moderation fixes and dialog states) are in
[`frontend-redesign/revision-9/index.html`](frontend-redesign/revision-9/index.html),
with [verification and genuine limits](frontend-redesign/revision-9/VERIFICATION.md).
The follow-up profile, moderation, role-page, setup-page, game-navigation and
avatar-crop repairs are documented in
[`frontend-redesign/workflow-repair/VERIFICATION.md`](frontend-redesign/workflow-repair/VERIFICATION.md).
The preceding homepage/settings and tailnet-access correction batch is in
[`frontend-redesign/revision-8/index.html`](frontend-redesign/revision-8/index.html),
with [verification and open work](frontend-redesign/revision-8/VERIFICATION.md).
The conservative-game and profile/setup/shop/forum revision is in
[`frontend-redesign/revision-7/index.html`](frontend-redesign/revision-7/index.html),
with [verification and remaining coverage](frontend-redesign/revision-7/VERIFICATION.md).
Revision 6's overly broad flattening was not accepted as a finished replacement;
its [historical evidence](frontend-redesign/revision-6/index.html) is retained.
The preceding mobile/icon/startup revision is in
[`frontend-redesign/revision-5/index.html`](frontend-redesign/revision-5/index.html).
The earlier seven-point revision is in
[`frontend-redesign/revision-4/index.html`](frontend-redesign/revision-4/index.html),
with [verification and remaining coverage](frontend-redesign/revision-4/VERIFICATION.md).
Earlier revised work and its evidence are in
[`frontend-redesign/revision-2.md`](frontend-redesign/revision-2.md) and the
[current screenshot review](frontend-redesign/review.html). The records below
describe the first pass, not the current design or its acceptance.

## User stories and decisions (before implementation)

1. **Find a seat:** returning players see open games, capacity, setup art and a
   clearly named Join action before feeds. Offer Open / Live / Finished filters,
   setup/title search, manual refresh and a useful empty state. Never conflate
   a full game with one that cannot be spectated. Filters apply to the fetched
   page, not an invented sitewide result count.
2. **First visit:** explain the game in one sentence, offer a tutorial without
   requiring an account, and explain why a guest cannot join. Do not hide the
   public game list behind registration.
3. **Host:** put Host a game alongside the lobby heading, rather than behind a
   dropdown or a featured-setup action. Keep all existing host configuration.
4. **Talk:** preserve fast Enter-to-send, reply, whisper, emotes and transcript
   following; add a visible Send action for touch and discoverability. Keep the
   composer visible and legible, and do not autofocus hidden retained views.
5. **Vote:** preserve meeting permissions and server-confirmed votes. Keep the
   voting action visibly separate from chat; on phones give Chat and Vote/Actions
   explicit, keyboard-accessible tabs rather than an unlabeled clickable phase
   widget. Preserve history navigation separately.
6. **Browse while playing:** retain the socket, game and draft while visiting
   other pages. Do not replace session ownership or membership navigation.
7. **Small screen:** 320–430px layouts must not scroll horizontally. Touch
   actions need usable targets; content must fit above safe-area-aware navigation
   and the keyboard. Desktop layout must not merely shrink into phone columns.
8. **Community:** discussion, chat, competitive content and optional feeds remain
   available but no longer compete with the game list. Use explicit secondary
   sections rather than removing features or storing surprising preferences.
9. **Identity and accessibility:** retain logo variants and all role artwork,
   role skins and user fonts/colors. Use a consistent charcoal/brass design with
   a real light palette, visible focus, reduced-motion support, adequate contrast,
   clear headings, selected states and descriptive control labels.

## Scope and evidence

The first implementation covers the site shell/navigation, shared design system,
lobby discovery, game workspace/composer/mobile controls, and shared styling on
community/learning pages. No features are deleted, dependencies replaced, backend
protocols changed, commits made or deployments requested.

`react_main/test/redesign.browser.jsx` renders production components with controlled
data. `react_main/test/run-redesign.cjs` records matching desktop/phone screenshots
and verifies interactions without accounts, servers or database access. Fixture
data is demonstrative, not a claim about live game availability. Before images
must be captured before editing production UI files; after images use the same
data and viewport sizes. Screenshots and run results are recorded below when run.

Unverified device behavior must stay distinguished from Chromium viewport tests.

## Review artifacts

- [Visual review gallery](frontend-redesign/review.html)
- [Lobby comparison](frontend-redesign/lobby-comparison.png)
- [Game comparison](frontend-redesign/game-comparison.png)
- [Glossary comparison](frontend-redesign/learn-comparison.png)
- [Player directory comparison](frontend-redesign/community-comparison.png)

`docs/frontend-redesign/before/` contains 12 original captures taken before any
production UI edits: four views at 1440×1000, 390×844 and 320×844. The additional
four light/guest/empty before captures were reproduced using an untouched detached
checkout of the original source, with the same fixture and browser. That temporary
checkout was removed after comparison. `after/` contains matching 16 captures plus
two phone voting-panel captures. The four comparison sheets crop only to the same
844px phone viewport; full images are also retained. Fictional game data is fixed
apart from relative-time labels.

## Implemented behavior

- Shell, shared surfaces, buttons, menus, tables and dialogs now share a
  charcoal/brass palette and a complementary warm light palette. Custom accents,
  holiday logo variants, role skins and user font preferences remain supported.
  Shared component overrides are now defined at the MUI theme's supported root.
- Desktop Play is a direct link. Creation, community and learning remain close;
  occasional fame/activity/policy destinations are collected under More. The
  phone glossary link now points to a real route. Skip-to-content and navigation
  selection semantics are included.
- Game rows distinguish Open, In progress and Finished with text, not color alone.
  Role art stays visible, setup titles open details, full games retain Spectate,
  and authentication/privacy/broken-game restrictions are unchanged.
- Status and search filters intersect on the fetched page. Phone search/lobby
  options are disclosed on demand so they do not push the first game offscreen.
  Refresh animation follows the request, rather than an artificial timer.
- Town square and extras load on first opening, then retain drafts and state.
  Their overlays are scoped to their active panel. Hidden chat is paused and the
  game-list poll pauses outside the Games section.
- Game panels lose decorative gradients; the composer gains a visible Send
  control while preserving Enter, reply, whispers and emotes. IME confirmation
  does not submit. Empty Tab no longer traps keyboard navigation. Phone history
  navigation remains separate from explicit, selected-state-aware game buttons.
- The glossary gains search and narrow-screen entry layouts. The player directory
  gains readable phone rows and ignores obsolete search responses.

## Verification performed

| Check | Observed result |
| --- | --- |
| Production Rsbuild build | Passed |
| Node frontend tests | 133 passed |
| Redesign browser fixture | 16 captured scenarios; layout/runtime/interaction assertions passed |
| App/session lifecycle fixture | 33 passed; no page errors or external requests |
| Phone header fixture | 25 checks passed, including 320px |
| Pregame seat actions | 27 checks passed |
| Lobby membership navigation | 7 checks passed |
| Player counts/details | 64 checks passed across Chromium and Firefox at desktop/phone widths |
| ESLint, including changed JSX explicitly | 0 errors; existing warnings remain |
| Existing chat-reply visual suite | 2,669 checks passed; 40 compact-reply connector-position assertions failed identically in an untouched control |
| Whitespace validation | `git diff --check` passed |

The lifecycle suite originally failed its old document-reload Spectate assertion
in both modified and untouched code. The fixture was corrected to forward the
current navigation-keyed membership request, like production `Main`, and now
verifies exactly-once `spectate`/`takeSeat` sends on the retained socket around
server acknowledgements. It does not bypass the server operation. The separate
lobby-membership fixture also passes. Historical documentation and the retained
session skill were updated to match this verified contract.

The redesigned fixture checks search/no-results/reset, full-table spectator
availability, preserved role art and setup details, lazy secondary sections,
button/Enter sends, IME safety, voting, draft retention on phone panel switches,
glossary search, guest restrictions and useful empty states. Chromium 158 was used
for these layout checks. Physical-device keyboard/browser-chrome behavior and live
authenticated server journeys have **not** been reverified for this redesign.

### Reproduce

Use an isolated Playwright installation, as described in
`docs/testing-app-lifecycle.md`; do not change application dependencies to run it.

```bash
cd react_main
node --test test/*.test.mjs
./node_modules/.bin/rsbuild build
./node_modules/.bin/rsbuild build --config rsbuild.redesign-test.config.ts
PLAYWRIGHT_MODULE=/path/to/isolated/playwright node test/run-redesign.cjs
```

Screenshots default to `/tmp/opencode/ultimafia-redesign/after`; set
`SCREENSHOT_DIR` to retain another run. For a new baseline, use
`DESIGN_PHASE=before` **before editing production UI**. The fixture can be served
locally with `rsbuild preview --config rsbuild.redesign-test.config.ts --port 3016`.
The review gallery is static and makes no live account/game requests.

## Remaining scope

This is a substantial first implementation, not a claim that every existing route
has been individually rebuilt and reviewed. Hosting/setup editing, authentication,
profiles, shop, moderation/admin tools and every non-Mafia game still need dedicated
user-story and before/after reviews beyond the shared theme. No feature deletion is
proposed without further usage evidence. The unrelated compact-reply visual failures
remain recorded rather than hidden or weakened. No production deployment, commit,
staging or changes to the user's unrelated analysis scripts/data were made.
