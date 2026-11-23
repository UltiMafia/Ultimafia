# Windowed game transcript

The game chat uses a bounded, measured window of rows rather than mounting the
entire history. Message data remains in the existing game state; this changes
rendering, not which messages the server sends or the client's permissions.

## Controls and compatibility

- **Virtualize transcript** in game settings controls this rendering mode and is
  enabled by default. The preference is saved with the other game settings.
- Turn it off for native browser Find across all messages or selection/copy across
  the entire transcript. Unmounted rows cannot participate in those browser APIs.
- Explicit `game.transcriptWindowing` overrides remain available to the developer
  fixture, so the same messages can be compared with windowing enabled/disabled.
- Existing partial game-context consumers without either flag retain full DOM.
- Separate pinned-message UI is unchanged. Reply-reference navigation can locate
  and mount an offscreen original message; ordinary quotes/pins do not gain new
  navigation behavior.

## Scroll ownership

`WindowedTranscript.jsx` owns measurement, above-reader height compensation,
append-follow and following-only viewport resize handling. The full-DOM follow
and resize effects are disabled in this mode. Measured flow-root wrappers include
message margins; browser native overflow anchoring is disabled to prevent double
correction. No cosmetic ancestor attributes are rewritten on scroll and no
nameplate layers are promoted.

TanStack Virtual is pinned in the lockfile. The adapter compensates height changes
above the reading anchor, preserves normal partially visible-row growth below
that anchor, and uses stable message keys. Merged quote IDs resolve to their
reply row without aliasing the quoted original's ID.

The iOS deferred-correction path needs two top-boundary safeguards: a native
sticky bound prevents held shrinking from exposing leading blank space, and a
bounded, cancelable completion after release handles native zero reached before
logical history ends. This completion is navigation, not reconstructed UIKit
inertia. A new touch cancels it.

Unseen rows are sized high (150px on iOS, the tuned 60px elsewhere) and measured
heights are cached by message key across remounts. iOS holds every correction
made during a finger or fling, so each row measured mid-fling adds its estimate
error to a held offset; at native scrollTop 0 that positive offset is history the
element cannot scroll to, and the fling stops at a false top. Underestimating
height feeds that directly, while overestimating only removes space that
measuring the row restores. With the constant 60px estimate a 100-row fixture
left 1,144px unreachable and a 300-row reference left 6,811px; sizing unseen
rows high leaves row zero aligned at the native top. Recalibrating mid-mount is
not an option: `virtualizer.measure()` clears `itemSizeCache` and re-lays the
list from index 0, which moved the reader and broke visible spacing.

Bounce-generated scroll events can arrive after that new touch. If the reader
then drags down away from the edge, that gesture invalidates the pending top
completion, including when the native position updates before its scroll event
is delivered. Releasing the finger must not revive the earlier upward intent.
Finger direction is tracked independently of native position: while overscrolling,
the finger can already be moving toward later messages even though scrollTop has
not become positive. That reversal cancels completion before release.

Entering bottom-follow mode does not itself issue navigation. The viewport resize
observer ignores its initial notification and only re-pins for an actual nonzero
size change, avoiding an unnecessary momentum-stop at the native bottom edge.

Virtual wrappers make each message a CSS last child. Only the actual final
non-empty row keeps the transcript's extra trailing padding; the other rows keep
their original density. Empty trailing quotes are accounted for after measurement.

## Reproduce the checks

From `react_main`, with Playwright installed externally or locally:

```sh
npm ci
npm run build
npm run test:lifecycle
npx rsbuild build --config rsbuild.chat-perf.config.ts
export PLAYWRIGHT_MODULE=/absolute/path/to/playwright
node perf/windowing-settings.cjs build-chat-perf
for ENGINE in webkit chromium; do
  export ENGINE
  node perf/windowing-check.cjs build-chat-perf
  node perf/windowing-anchor.test.cjs build-chat-perf
  EMPTY_TAIL=1 node perf/windowing-spacing.test.cjs build-chat-perf
done
ENGINE=webkit EDGE_RELEASE_EARLY=1 node perf/windowing-touch-edge.test.cjs build-chat-perf
ENGINE=webkit node perf/windowing-fling.test.cjs build-chat-perf
ENGINE=webkit IOS_LEGACY_WRITES=1 node perf/windowing-fling.test.cjs build-chat-perf
ENGINE=webkit FLING_INTERRUPT=1 node perf/windowing-fling.test.cjs build-chat-perf
ENGINE=webkit FLING_REVERSE=1 node perf/windowing-fling.test.cjs build-chat-perf
ENGINE=webkit FLING_REVERSE_RELEASE=1 node perf/windowing-fling.test.cjs build-chat-perf
ENGINE=webkit FLING_REVERSE_TOUCH=1 node perf/windowing-fling.test.cjs build-chat-perf
ENGINE=webkit node perf/windowing-bottom.test.cjs build-chat-perf
```

Open the perf fixture with
`?count=2214&nameplates=1717&cosmetic=mixed&virtual=1&sweep=on`.
`virtual=0` is the full-DOM control. `sweep=off` is a static-at-load comparison,
not runtime animation pausing. Cosmetic overrides are fixture-only.

The spacing driver checks all four layouts, desktop/mobile viewport widths and
light/dark CSS schemes, at top/middle/bottom. It compares row dimensions and gaps
intersecting the viewport; offscreen overscan positions may still be estimates.

## Evidence and remaining validation

Linux Playwright WebKit 27.2 and Chromium 156.0.8078.4 measured 0px unintended
anchor displacement in the growth/shrink/batch/cold-scroll probes and 0px
row-height/visible-gap difference against full DOM in the spacing matrix. The
functional driver covers bounded DOM, initial bottom, append following and
anchoring, unread count, latest navigation, viewport shrink, merged replies and
offscreen reply jumps. Held-shrink and fling tests exercise actual library/DOM
state using synthetic gestures and controlled estimates; they do not measure
physical iPhone compositor behavior or UIKit inertial physics.

The tester reported smooth phone scrolling with name animations enabled and
approved the final phone/desktop fixture behavior. This is user-reported evidence,
not an automated device FPS measurement. Original exploratory-library performance
numbers are deliberately not presented as measurements of this adapter.

Before marking the draft production-ready, exercise authenticated live games,
review/state/tab/filter transitions, long newspaper/obituary/winner rows, hidden
retained game return, keyboard resizing on actual iOS, and effects that can replay
when a row remounts. The full-DOM setting is the browser Find/selection fallback.
