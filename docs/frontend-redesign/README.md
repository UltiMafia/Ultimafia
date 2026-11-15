# Client redesign

This branch replaces the client's design. The site works; the remaining work is
consistency and the defects listed below.

## Working on it

Read the code, change it, then verify with three commands and by using the site:

```sh
cd react_main
npm run lint:ui                  # shared-control rules and legacy budget
node --test test/*.test.mjs      # unit tests
npm run build
```

For a visual change, capture the routes you touched and look at them:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright \
ROUTE_CASES=lobby,stocks ROUTE_WIDTHS=1440,390 ROUTE_THEME=dark \
ROUTE_OUTPUT_DIR=/tmp/check-$(date +%s) node test/run-route-review.cjs
```

The runner asserts there are no runtime errors, no failed assets, no clipped
labels, no touching controls and the navigation contracts hold. It does not
judge taste; open the images.

## Documents

- [`UI_CONTROLS.md`](UI_CONTROLS.md) — which control to use, and the rules that
  are enforced. Normative: an unprecedented UI choice is a defect.
- [`UI_ARCHITECTURE.md`](UI_ARCHITECTURE.md) — the shared primitives and page
  shells.
- [`audit/README.md`](audit/README.md) — how to capture routes, what the checks
  cover, and what they do not.
- [`dialogs/report.md`](dialogs/report.md) — last overlay audit, with the
  findings that are still open.

## Known open defects

- Desktop forum thread: a large empty gap inside the first post.
- Setup detail: role chips wrap into wide tracks, leaving a hole.
- `moderation-ban-appeals`: table header is 72.5px where every other table is
  48.5px.
- Detail-page section headings are 24px where the scale says 21px.
- "Coins" labels vary in size and weight across family/shop widgets.
- Hall of Fame still renders a CSS grid rather than a table; Stock Market's
  portfolio and transaction tables are still hand-rolled.
- The Games list paginates by cursor, so it can show only the current page and
  cannot disable "next" at the end. Numbered pages need a total from the API.
- Dialog and overlay findings from `npm run ui:dialogs` (12 open).

## History

The numbered revision galleries and dated verification reports that used to
live here were removed: they described superseded states, cost megabytes, and
made every conversation about the audit rather than the site. Git history keeps
them. The comparative audit no longer compares against upstream master, because
master is the design being replaced; see `audit/README.md`.
