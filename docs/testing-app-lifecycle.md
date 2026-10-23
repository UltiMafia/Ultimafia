# App/session lifecycle regression checks

These checks accompany the app-shell hardening. They import production socket,
request, sheet and routing code; they do not replace those implementations with
source-text assertions. No new project dependency is needed.

## Browser-free checks

```bash
cd react_main
npm run test:lifecycle
```

Node 22.17+ tests use a controlled WebSocket and timers. They cover:

- idempotent disposal, heartbeat cancellation and connection-store cleanup;
- callbacks already queued on a disposed/superseded native connection;
- reconnect detachment and exactly-once queued sends;
- bounded catch-up delivery, malformed messages and heartbeat exclusion;
- component-owned subscription cleanup, replay failures and returned-handler
  safety; rebinding an existing transport without replaying applied events;
- aborted/out-of-order results, including a transport that ignores cancellation;
- sheet ownership before fetch, replacement, current-content updates,
  dismissal/navigation invalidation and exit/reopen races;
- the documented safe-area UA exception, including Firefox iOS versus Gecko.

The replay buffer retains at most 1,024 non-heartbeat deliveries per native
connection. It is not the chat/history store: React game state still retains
the transcript. A newly mounted late subscriber gets that bounded catch-up;
replacement handlers on the same transport do not reapply it.

## Production browser fixture

```bash
cd react_main
npx rsbuild build --config rsbuild.lifecycle-test.config.ts
```

The separate output is `/tmp/opencode/ultimafia-lifecycle-browser`. This entry
does not ship in the application. Axios transport and native WebSocket traffic
are controlled inside the fixture; no live account/game/database is used.

For automated execution, install Playwright outside the shared dependency tree:

```bash
npm install --prefix /tmp/opencode/lifecycle-tools --no-save --no-package-lock playwright
PLAYWRIGHT_BROWSERS_PATH=/tmp/opencode/lifecycle-tools/browsers \
  /tmp/opencode/lifecycle-tools/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/opencode/lifecycle-tools/node_modules/playwright \
PLAYWRIGHT_BROWSERS_PATH=/tmp/opencode/lifecycle-tools/browsers \
  node test/run-browser.cjs /tmp/opencode/ultimafia-lifecycle-browser
```

`CHROMIUM_PATH` optionally selects an installed Linux/macOS Chromium. The runner
refuses fresh-profile Windows launches, serves only loopback on an ephemeral
port, blocks external browser requests and closes its browser/server in finally.
It fails on assertion failures, page/console errors or blocked external requests.
The fixture reports exact failure names, not just a successful build/exit code.

Alternatively `npm run test:lifecycle:browser` serves the production fixture on
loopback port 3003. It runs automatically and exposes `window.__lifecycleResults`.
The embedded desktop-browser harness may not schedule animation frames even
when reporting the page visible; use the isolated Chromium runner for drag
checks instead of removing the frame-dependent assertions.

Browser cases exercise actual React 17/React Router/MUI components:

- retained site state and real lifecycle location, socket/session persistence
  while browsing, and disposal on leave;
- previous-page query/hash and scroll-element preservation, direct-link fallback,
  and no redirect on server-driven leave while browsing another page;
- game-entry spectator/bot intent retained through lazy mounting, authentication,
  guest joins and reconnects while browsing, with only server-confirmed seat
  changes replacing the spectator reconnect mode; explicit lobby Spectate
  actions use document navigation so a retained seated session is not reused;
- full public lobbies hide Join but retain Spectate, without exposing private,
  broken or spectating-disabled games or bypassing the logged-in requirement;
- conditional/imperative site redirects not hijacking a game while inactive;
- game → profile → game navigation stopping native audio/video and removing all
  five provider iframe types while retaining profile state and the game socket;
  returning to the profile recreates players with saved volume/mute options;
- portalled dialogs staying inside their owner and hiding with an inactive view;
- sheet ownership, updates and pending opens invalidated by navigation;
- drag distance, no React content rerender per pointer move, release offset,
  exit cleanup and navbar restoration before exit finishes;
- profile fetch replaced by another sheet or invalidated by navigation;
- role marking with current player callbacks and no nested hover card;
- actual user-provider/socket membership updates, late join/finish races,
  scoped leave, absent membership and logout;
- retained game identity remaining stable on refresh but discarded on an
  account/sign-in identity change, without reusing the old authenticated socket;
- real chat login/logout token races, replaced registrations and disposal;
- actual lobby reversed responses, inactive requests, return refresh, accepted
  page cursors and retrying a failed lobby change;
- nested Back dismissal, preserved router state and no extra Back marker;
- keyboard recovery without blur for both visual-only and layout resizing.

The synthetic-pointer case stubs native pointer capture only; its handlers,
frame updates, CSS, MUI transition and assertions are real. This is not a phone
FPS benchmark or proof of physical touch capture. Native mouse drag was also
smoke-tested against the real local application.

The explicit Spectate regression observes document navigation and prevents the
actual reload so the fixture can finish. It verifies the client action, not a
live server's membership transition; the game-engine tests cover that path.

## Retained-view rules

`RetainedSiteRoutes` uses the public `Routes location` prop to retain only route
matching. A nested route reads the location of the view it renders. Chrome and
lifecycle work use actual navigation through `AppLocationContext`/`useAppLocation`;
the app no longer injects `UNSAFE_LocationContext`. `useViewActive` tells retained
components whether they may act on navigation, show an overlay or poll.
Site redirects use `ViewNavigate`/`useViewNavigate`, preserving the router API
while suppressing inactive or unmounted view callbacks. The declarative redirect
is deferred until the page is active; a stale imperative callback is discarded.
Session-owner and ready-check navigation remains intentionally app-global.

Game/chat sockets and game state updates intentionally continue while browsing.
The hosted session owns its original game-entry query, not the current site's
URL. Server-confirmed membership changes update its spectator reconnect mode.
An explicit Spectate action uses a document navigation (like the in-game
Spectate button) to ask the server to change membership; ordinary navigation back
to the game retains the existing session and never implicitly takes a seat.
Changing account identity discards the previous game's client session; it does
not send another account's leave command or promise that the server seat has
already been removed. A same-account refresh preserves the session.
Hidden game autofocus is disabled, music channels muted, custom death-sound
playback/queues stopped, incidental game modals gated, and shared popovers and
inventory/dice menus closed. Ready-check dialogs are deliberately global so a
player browsing the site can still respond. Site list/activity polling pauses
while the view is inactive. Async callbacks must still use request ownership;
remaining mounted is not a reason to accept obsolete responses.

`MediaEmbed` removes its players while `useViewActive` is false: CSS hiding alone
does not stop native or cross-origin iframe playback. Its collapse state stays
mounted, but playback position resets on return (and configured autoplay applies
again). Native playback is exercised with a local silent WAV; third-party frame
documents are controlled fixtures, so removal is tested without claiming live
YouTube/SoundCloud/Spotify/Vimeo/Invidious integration coverage.

`ViewOverlayBoundary` supplies an owned portal container through MUI's public
theme defaults. Container attachment is reactive: child portal layout effects
can otherwise select body before the parent ref exists. Inactive views do not
enforce focus, auto-focus or lock the visible page. Keep global overlays outside
this boundary only when they are intentionally global.

## Real-device testing and regression checklist

Real-device Safari/iOS and Android testing has been completed, as confirmed by
the maintainer. It must not be described as outstanding merely because the
automated fixtures use viewport simulation. Exact browser versions and installed
versus browser-tab modes are not recorded here; this confirmation does not claim
exhaustive coverage of every browser/version/mode combination.

Neither viewport simulation nor a UA-string test alone verifies native browser
policy. Retain the following checklist for future real-device regression runs
in Firefox Android, Chrome Android, Safari iOS, and installed iOS/Android modes.
Record the browser/version and mode for each run, then check:

1. bottom nav clear of the gesture/home strip without an extra gap;
2. open/dismiss/reopen a sheet, scroll its content, tap and drag the handle;
3. keyboard open/close with focus retained, portrait/landscape and browser-bar
   expansion; transcript following versus reading older messages;
4. real theme-color/native chrome appearance, live reconnect/ready checks and
   reload warnings; no effect from visiting decks on navbar icon sizes.

The Firefox-only safe-area exception and 150px keyboard threshold remain
documented workarounds, not portable feature guarantees.

## Backend-suite limitation

The ordinary `npm test` suite was attempted in separate Mongo test namespaces
and previously unused Redis databases, not the development Redis database 0.
It reported failures; a committed pre-hardening control also failed and hit a
worker heap limit. Its exit status was **0 despite errors**, so that status is
not evidence of a green suite. The failing server/game suites and engine sources
are unchanged by this hardening work. Fix/investigate that test infrastructure before
using the full suite as an automatic deployment gate. The existing focused
`NODE_ENV=test npx mocha test/webAudio.test.js` checks passed independently,
including a new custom-sound cancellation/resumable-music regression.
