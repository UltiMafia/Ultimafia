# Comparative UI audit

Run `cd react_main && npm run audit:ui`. Set `PLAYWRIGHT_MODULE` to an isolated
Playwright installation; the existing `/tmp/opencode/redesign-tools/node_modules/playwright`
is the local default. Install Chromium for that Playwright version first. The
fixture build uses `--no-env`, a fake public Firebase project and in-memory reads
and opted-in writes; it cannot submit to live services.

The runner builds each branch once, then captures dark/light at 1440/390/320. Top and scrolled
bottom are separate viewport images, not stitched phone pages. It measures the
actual production components and records bundle hashes, source revision and
whether tracked source had uncommitted changes. Never label a dirty capture as
final-HEAD evidence.

`inventory.json` enumerates stable route/state IDs. `coverage.json` has the full
six-cell denominator per ID, including uncaptured states. `measurements.json`
records header/container geometry, shell widths/offsets and role-based computed
styles. `findings.json` and `report.html` expose geometry candidates with peer
medians and paired master values. `capture-manifest.json` hashes the images.
`role-comparisons.json` groups every observed style by UI role/property, retains
its selectors and compares it with the cross-route reference and actual-master
role values. Each peer route contributes once; a 443-row directory cannot
overweight a single-field form. These comparisons remain `requires-review`, not
automatically accepted differences.

The command **fails** if coverage is incomplete or findings remain open. Missing
master captures are gaps, not `not-on-master` exemptions. `masterStatus:
unverified` explicitly means a comparison was not performed. It must not be
reported as `same`, `changed` or `not-on-master` without actual evidence.

For iteration, use `ROUTE_CASES=players ROUTE_WIDTHS=320 npm run audit:ui`.
This deliberately leaves the full denominator unchanged. Regenerate reports
without capturing with `node test/run-ui-audit.cjs --report-only`. Use
`--redesign-only` or `--master-only` for independent immutable bundle runs.
Use `UI_AUDIT_OUTPUT` for an independent run; before/after output folders are
distinct (`DESIGN_PHASE=before` or `after`). Do not rebuild a bundle being served
by another runner.

## Current limits — not completion

The initial inventory derives from the existing route registry plus its explicit
task captures. It still needs expansion to all global overlays, game states,
menus, loading/empty/permission branches and uncaptured dialogs. Actual upstream
master pairing uses the untouched worktree at `/tmp/opencode/ultimafia-master`
(override with `UI_AUDIT_MASTER`). The runner refuses any revision other than the
fetched `origin/master` or changes to that worktree's production source. It
renders master’s **complete Main and route tree**, not the redesign shell with
old colors. Reads and passive acknowledgements stay in memory, with the same
controlled records; this is separate from live same-database public-route pairs,
which now have a separate `live-public` run. The shell-contract run paired
510/516 registered cells; its six feedback gaps were diagnosed and the focused
master feedback rerun passed after targeting the accessible textbox rather than
MUI's hidden autosize textarea. A replacement full run is still required. The
report does not interpret a missing master as a redesign regression. Geometry
candidates require image inspection and classification; automated capture is not
visual acceptance, nor evidence of live authentication or physical-phone behavior.
