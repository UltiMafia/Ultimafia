# Plan: make Ultimafia behave like an application rather than a page

Status: layers 1, 2a, 3, and 4 are implemented, together with parts of layer 5
(delivery deduplication, connection status, and an unread affordance). Layer 2b,
the optimistic send lifecycle, and ephemeral signals are not implemented.

## 1. Problem

The web client at ultimafia.com is a single-page application that behaves like a set
of pages. Navigation replaces the whole view, page-sized loading screens gate every
transition, the game owns its network connection and all of its state inside one
route component, and the viewport is a scrolling document rather than a fixed
application frame. The result is that the site feels like a website that happens to
run in a browser tab, not like an application.

## 2. Diagnosis (observed)

All citations are to the working tree at the time of writing.

### 2.1 Navigation swaps the whole tree

`react_main/src/Main.jsx:182-198` defines two mutually exclusive trees selected by
URL: `/game/:gameId/*` renders `gameContent` (`Game` plus `AlertList`) and `/*`
renders `siteContent` (cookie banner, `Header`, page routes, `InGameWarning`,
`AlertList`, `Footer`). Entering or leaving a game mounts and unmounts the entire
site chrome. Nothing outside `UserProvider` (`Main.jsx:216`) survives the swap.

### 2.2 The game owns its connection and its state

The game WebSocket is created inside the `Game` component and cleared on unmount
(`react_main/src/pages/Game/Game.jsx:451-473`); `react_main/src/Socket.js:124-140`
never reconnects after `clear()`. The chat socket has the same shape
(`react_main/src/pages/Chat/Chat.jsx:82-104`) and only exists while the lobby browser
is mounted. `GameContext` is provided inside `Game` (`Game.jsx:1201`), and all game
state is `useState`/`useReducer` local to it (`Game.jsx:175-255`). Leaving the game
route therefore destroys the session. There is no distinction between deliberately
leaving a game and navigating away from the page.

### 2.3 Page-sized loading and hard reloads

`react_main/src/components/Loading.jsx:20` defaults to `height: "100vh"` and is used
as the `Suspense` fallback and the bootstrap gate (`Main.jsx:157,185,193,206`). Full
document reloads are used for sign-in (`Auth.jsx:157,242`), a Google redirect
(`Welcome.jsx:52`), error recovery (`Main.jsx:211-214`) and chunk retry
(`lib/lazyWithRetry.js:33`).

### 2.4 Document scrolling and a page viewport

Site pages scroll the document (`minHeight: "100vh"`, `Main.jsx:130-133`;
`html/body/#root { height: 100% }`, `css/main.css:63-84`). The game instead scrolls
inner panels (`css/game.css:47-58`). There is no `viewport-fit=cover` or safe-area
handling, deliberately, per the comment at `public/index.html:81-84`.

### 2.5 Litmus test

The Android project's engineering plan states the test as whether each system can be
"instantiated and used completely independent of each other for tests"
(`~/Documents/ultimafia-android/docs/ENGINEERING-PLAN.md`). The web client fails it:
transport, reducer, and presentation all live in `Game.jsx`, which is 6,563 lines.

## 3. Target architecture

An application shell that mounts once and never unmounts; a game session that is
owned above the view layer and keyed by game identity; view changes that are
animated and never blank the screen; a fixed application viewport with inner
scrolling and safe areas.

## 4. Work layers

- Layer 1, persistent shell. One tree. The site chrome stays mounted while a game is
  displayed; the game is a view in the shell, not a sibling tree. (Implemented.)
- Layer 2a, persistent game session. The game is hosted outside the route table,
  keyed by `gameId`, so ordinary navigation does not destroy its connection or state,
  and an explicit leave tears it down. (Implemented.)
- Layer 2b, module separation. Split `Game.jsx` into a transport module, a reducer
  module, and a presentation component with the same boundaries as `network-core`,
  `game-core`, and `client-core`. (Planned.)
- Layer 3, continuous navigation. (Implemented.)
  - In-place loading: attempted with a shorter `Suspense` fallback, reverted. The
    placeholder size change shifted the footer during transitions. The original
    full-screen `Loading` fallback is restored.
  - Route enter animation: removed. It set the content container to `opacity: 0`
    and faded in on every navigation, which blanked the page during the transition.
  - Reload guard: while a game is in progress, `Game` registers `beforeunload` so a
    reload or tab close is confirmed. In-app navigation is not blocked, because the
    shell retains the session.
  - Document reloads removed from the ordinary sign-in paths: `Auth.jsx` and
    `Welcome.jsx` call `user.refreshUser()` (added to `UserProvider` in
    `Contexts.jsx`) instead of `window.location.reload()`.
  - Not done: an in-app back blocker. `useBlocker` requires a data router
    (`createBrowserRouter`); this app uses `BrowserRouter`, so `beforeunload` is the
    available mechanism.
- Layer 4, application viewport. (Implemented.)
  - `viewport-fit=cover` in `public/index.html`, and safe-area variables
    (`--safe-inset-*`) in `css/main.css` applied to the connection banner and the
    speech input area.
  - Dynamic viewport units: the shell `min-height` and the full-screen `Loading`
    default are `100dvh` rather than `100vh`.
  - `hooks/useKeyboardInset.jsx` watches `window.visualViewport` and lifts the
    speech input above the on-screen keyboard.
  - Not done: converting the whole site shell to a fixed frame with inner scrolling.
    Site pages still scroll the document.
- Layer 5, real-time synchronization contract. (Partly implemented.)
  - Delivery semantics (`#2`): `useHistoryReducer` ignores a message whose id has
    already been applied, seeded from the full history on a `set`, so a replayed
    history after a reconnect does not duplicate rows.
  - Connection status (`#3`): `lib/connectionStatus.js` is an external store that
    every socket registers with; `components/ConnectionBanner.jsx` shows one
    app-level offline/reconnecting/connecting banner.
  - Attention (`#4`): `TextMeetingLayout` counts messages that arrive while the
    reader is scrolled away and shows a "N new messages" button that returns to the
    newest line. Per-meeting unread tab markers are not done.
  - Not done: the send lifecycle (`#1`) and ephemeral typing/speaking signals
    (`#5`).

## 5. Design of layers 1 and 2a

### 5.1 Main renders one shell and one game host

`Main` (`Main.jsx`) renders the site shell unconditionally. The shell is hidden with
`display: none` while a game is displayed, which keeps it mounted and keeps its state
alive; it is not unmounted. The shell's route table gains a `game/:gameId/*` entry
that renders `null`, so the shell's catch-all redirect does not fire while a game URL
is active.

The game is rendered by a sibling element, outside the route table, from a
`hostedGameId` value that `Main` retains:

- While the URL matches `/game/:id`, `hostedGameId` is `id`.
- When the URL stops matching, `hostedGameId` is retained, so the session stays
  mounted (hidden) and the connection is not torn down.
- When the URL matches a different `/game/:id`, the `key` changes and React replaces
  the session.
- When the game reports that it left, `hostedGameId` is cleared and the session is
  unmounted; the socket cleanup at `Game.jsx:451-473` runs as it does today.

`AlertList` moves out of both trees to a single top-level element so alerts are
visible both in the shell and in a game.

### 5.2 Game becomes a hosted component

`Game` accepts `gameId` and `onLeave` props and falls back to `useParams()` so it
still works if rendered inside a route. The three `useParams()` call sites
(`Game.jsx:237,1378,5860`) use the context `gameId` where a route parameter is no
longer available. The `leave` state, which previously terminated the component with
`<Navigate to="/play" />` (`Game.jsx:1123`), now calls `onLeave` from an effect.

Effect ordering is unchanged. The session component is not remounted by ordinary
navigation, so socket listeners, the history reducer, and audio keep running.

### 5.3 Leave semantics

Leaving a game deliberately (the leave dialog, the Escape key, a server message that
ends the game) clears `hostedGameId`. Navigating to another page does not; the
session is hidden and retained. This matches the server model, in which a player
remains in a game until the server receives `leave`.

## 6. Risks

- Hiding the shell with `display: none` removes it from layout while a game is
  shown. Any shell effect that measures layout during that time measures zero. The
  shell does not currently measure layout.
- A retained session keeps its socket open while the user browses, so a game the
  user is still in continues to run. This is intended, but it is a behavior change
  from today, where the socket dies on navigation.
- Rendering `Game` outside the route table means route parameters are unavailable
  inside it. Every `useParams()` call site must be audited.
- The game's full-height layout depends on the container chain. The host element
  must give the game a definite height.

## 7. Verification

- Static: ESLint over the changed files adds no errors. A full production build of
  the client succeeds (with a temporary stub for `qrcode.react`, absent from this
  checkout's node_modules).
- Runtime (guest shell): loading `/`, `/play`, and `/community` against the running
  development stack produces no page errors, renders the shell on each route, and
  shows no connection banner while every socket is healthy.
- Not verified at runtime: anything requiring a signed-in account and a live game —
  replay deduplication, the "N new messages" affordance, the reload guard, the
  keyboard inset, and the connection banner during a real disconnect. These are open
  gaps, not verified behavior.

## 8. Rollback

The change is confined to `Main.jsx`, `Game.jsx`, and one CSS file, and is left
uncommitted for review. Reverting those files restores the previous behavior.

## 9. Deferred

Layer 2b (the module split) is the change that makes the systems independently
testable. It is deliberately separate because it is a large mechanical refactor of
`Game.jsx` and carries the highest risk; it should be done with the game fixture
extended to mount the session directly.

Also deferred, with reasons:

- The send lifecycle and ephemeral typing/speaking signals (layer 5, items 1 and 5).
- An in-app back blocker, because it needs a data router.
- Per-meeting unread markers; only the transcript-wide affordance is implemented.
- A fixed shell with inner scrolling for site pages; they still scroll the document.

## 10. App-like pass (implemented)

A second pass targeted the concrete "behaves like a website" complaints.

- Lobby switching reloaded the whole page. Root cause: `Play.jsx` called `lazy()`
  inside the component body, so every render — including a `?lobby=` change —
  created new component types and React remounted the entire page. The `lazy()`
  declarations are now at module scope. Verified: switching lobbies keeps the tab
  bar mounted, shows no spinner, and keeps the header.
- The Join button is hidden for a full, not-started (`Open`) game, which previously
  navigated into a game that refused the player and hung on a loading screen.
- Spinners: the fake 200ms minimum in `useLoading` is removed; the lobby list keeps
  the previous rows visible while loading; route `Suspense` fallbacks are compact
  in-place spinners instead of `100vh`.
- Full-page loads removed for in-app actions: deck and word-deck create/shop links,
  the in-game Return button, setup edit/copy, logout, and report/rap-sheet game
  links now use client-side navigation. No `window.location.reload()` remains
  outside the two legitimate fallbacks (service-worker mismatch and chunk-load
  retry).
- View Transitions: tried and removed. `components/TransitionLink.jsx` ran
  navigation inside `document.startViewTransition`, but the API renders the
  previous page as a snapshot over the new one, and in this app the old page
  ghosted on top of the new one during every transition. Disabling the box-morph,
  removing the old content snapshot, and removing the old chrome snapshot did not
  remove the artifact. Navigation is client-side and instant instead, with no
  remount and no full-page spinner, so no snapshot layer is needed. Do not
  reintroduce snapshot-based page transitions without reproducing that artifact
  first.
- The large site footer is hidden on phones, replaced by an app-style bottom
  navigation (`components/MobileNav.jsx`) with Play, Community, Fame, Learn, and
  Profile/Login, highlighted by route and safe-area aware. It lives inside the
  shell, so it hides with the shell while a game is full screen.
- A ready check that arrives while the player is on another page now returns them
  to the game when they confirm; declining still tears the session down without
  navigating anywhere.
- Popovers and header menus close on navigation. `usePopoverOpen` clears its
  anchor on every route change (a popover anchored to an element on the previous
  page otherwise lingered), and `NavDropdown` closes its menu on route changes.

Verified: lint clean (two pre-existing `Game.jsx` errors only); full production
build passes; guest routes render with no page errors; lobby switching has no
remount and no spinner; a screencast of a client-side navigation shows a clean
cut with no ghosted content; the phone bottom bar renders only at 390px, navigates
by route, and is absent at 1280px.

Not verified at runtime: the ready-check return and the popover-close were not
exercised against a live game or an opened popover (the guest shell did not open
one), so they are logic-verified only.
