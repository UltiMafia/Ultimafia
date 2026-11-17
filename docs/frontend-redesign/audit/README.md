# Verifying a UI change

There is no full-site matrix. Capture the routes you changed, look at the
images, and check the three gates in `react_main`:

```sh
npm run lint:ui
node --test test/*.test.mjs
npm run build
```

## Route capture

```sh
cd react_main
PLAYWRIGHT_MODULE=/path/to/playwright \
ROUTE_CASES=lobby,stocks,profile-default ROUTE_WIDTHS=1440,390 ROUTE_THEME=dark \
ROUTE_OUTPUT_DIR=/tmp/check-$(date +%s) node test/run-route-review.cjs
```

Output is one directory per run with top and separately scrolled bottom images.
Set `ROUTE_THEME=light` for the light palette. `ROUTE_CAPTURE_STATES` limits task
images; the default captures them.

The runner renders production components with controlled records, blocks writes,
and fails a route on a runtime error, a console error, a blocked request, a
missing static asset or a failed fixture contract. It measures:

- labels clipped by their container (`labelClippedByContainer`);
- a control stacked on the next one with less than 4px between them
  (`touchingControls`), and adjacent form fields (`touchingFields`);
- fill shortfalls where a block had wider allocated space or declared full width;
- phone navigation touch size, active-label visibility, wrapping, and fixed bars
  covering content;
- header geometry, and cross-route presentation of the same control role.

A clean run is not visual acceptance. Look at the images.

## Dialogs, menus and popovers

These are not reachable from a route capture. They have their own runner:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright npm run ui:dialogs
```

It inventories every dialog/menu/popover usage in source (the inventory is the
denominator), probes route triggers, opens what it can, and reports unreachable
overlays as "not reached", never as clean. The last run is
[`../dialogs/report.md`](../dialogs/report.md); its findings are open work.
Game-only overlays need explicit fixture states before it can see them.

## Limits

- Chromium viewports, not physical devices.
- Fixture data, not live accounts; signed-in journeys are not established here.
- It does not grade taste, hierarchy or composition.
- A rule exists only after someone names the defect; the checks are a fence
  against repeat offenders, not discovery.
