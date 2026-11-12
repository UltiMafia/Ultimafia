# Comparative UI audit

Run `cd react_main && ROUTE_CASES=<changed-routes> npm run audit:ui`. Set `PLAYWRIGHT_MODULE` to an isolated
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

Clipping values are numeric pixels with the original control/container boxes.
Actual-master targets match normalized control role/name and tablist index;
missing or ambiguous matches remain explicit rather than becoming zero. The
versioned `test/ui-audit/intentional-differences.json` contains narrow, named review
rules. The Learn tab-window rule requires matched master evidence, an overflowing
MUI window, an enabled visual arrow, complete selected labels/usable targets and
passing first/last keyboard checks. It does not exempt other surfaces or ordinary
controls. Intentional findings retain geometry, screenshots, master deltas and
their reason in JSON/HTML. Summary counts distinguish total, intentional and open;
classification never means visual acceptance or creates missing coverage.

## Layout contracts

Two defect classes are graded numerically rather than judged from pixels.

**Fill and content edge.** Every sampled block is compared with the space actually
allocated to it: the parent's content box, a resolved grid track, or an aligned
section content edge reached by following aligned wrappers. A shortfall only
becomes a finding when there is evidence that wider space was available — a
wider aligned sibling, a section rule or divider spanning further right, or a
declared full-width intent (`data-ui-fill="full"`, `MuiFormControl-fullWidth`,
`MuiButton-fullWidth`). Tolerance is 8px. Properties:
`declaredFullWidthShortfall`, `contentEdgeShortfall`, `pairedFillWidthRegression`
(allocated-space ratio lost against the paired master) and
`fillMeasurementUnavailable`.

Not every candidate is measurable: a flex-row allocation without an explicit
track contract, an unresolved grid track, or a hidden element is recorded as
`unmeasurable` in `measurement-coverage.json` and **not** raised as a finding,
unless the element declares full width — in that case the missing measurement is
the defect. Label-, icon- and text-sized roles are intrinsic and never count as
short: `primaryAction`, `secondaryAction`, `utilityIcon`, `currency`, `tab`,
`sectionNavItem`, `sectionHeading`, `tableHeader` and `emptyState`. A status line
is text, not a block.

**Section navigation and fixed bars (≤700px).** Every `nav`, `[role=navigation]`
and `[role=tablist]` item records touch size, active state, label line count,
label visibility inside its scroll window, and whether a fixed or sticky bar
covers it. Properties: `navigationTouchTarget` (44px minimum, 1px tolerance),
`activeNavigationItemClipped`, `navigationLabelWrapping` (one line for tabs, two
for links) and `navigationCoveredByFixedBar`. Page content is also checked
against fixed bars after scrolling to the bottom, as
`contentCoveredByFixedBar`.

**Cross-page divergence is graded, not merely listed.** `role-comparisons.json`
rows are compared with the cross-route reference and graded with the tolerances in
`role-review-rules.json`: 1px font size, 1px font weight, 1px line height, 2px
height, 8px width, 0.03 fill ratio. Intrinsic roles are exempt from width only;
they are still graded on height, and touch size is graded separately. Content-sized
roles — `sectionContainer`, `sectionHeading`, `card`, `comment`, `commentList`,
`declaredFill`, `emptyState`, `stat` — are **not graded** on height, width or fill
ratio, because those follow their content; their alignment is covered by the fill
contracts. Ungraded rows stay in `role-comparisons.json` with `not-graded` and
never become findings. Divergence that matches a review rule is marked
`intentional` with its reason; everything else is `open` and stays visible.

Having a width is never evidence of underfilling. A fill shortfall requires a
wider aligned sibling, a section rule or divider, or a declared full-width intent.
The page heading is the first `h1` (or level-1 heading role); a smaller `h2` label
or breadcrumb above it is not the page title and must not be measured as one.

A shortfall is a measurement, not a verdict: the value, boxes, container,
evidence and paired master value are retained for review. Structural targets
without a name cannot be matched to master and stay `unverified-target`.

For iteration, use `ROUTE_CASES=players ROUTE_WIDTHS=320 npm run audit:ui`.
Interim capture requires an explicit route scope and defaults to a **120-image
budget for the entire command**, across branches and palettes, including failed
diagnostic attempts. Set a smaller `UI_AUDIT_CAPTURE_LIMIT` for small slices.
`ROUTE_CAPTURE_STATES=modifiers,settings` keeps those task images while still
running the other assertions and retaining the complete inventory denominator.
Include `default` to capture initial top/bottom images; otherwise those images are
reused only through explicit input provenance or remain coverage gaps. Direct route runners default to 120 images
per process and accept `ROUTE_CAPTURE_LIMIT`; a manual multi-process slice must
divide its stated total budget across those processes. Reuse identical immutable
bundles and already captured master counterparts where verified. Do not generate
fresh full-site matrices for individual repairs. `UI_AUDIT_FINAL=1` is reserved
for the single complete matrix after all feasible work is genuinely finished.
This deliberately leaves the full denominator unchanged. Regenerate reports
without capturing with `node test/run-ui-audit.cjs --report-only`. Use
`--redesign-only` or `--master-only` for independent immutable bundle runs.
Use `UI_AUDIT_OUTPUT` for an independent run; before/after output folders are
distinct (`DESIGN_PHASE=before` or `after`). Do not rebuild a bundle being served
by another runner.

The runner serves each branch's original public asset directory read-only; fixture
builds do not duplicate its audio/artwork archive. Set `UI_AUDIT_BUNDLE_ROOT` to an
owned disk-backed temporary directory if `/tmp` hits its per-user quota. Set
`TMPDIR` on the command too to relocate browser scratch files. This is a storage
workaround, not permission to delete old builds, worktrees or evidence.

Generate hash-deduplicated inspection sheets with Pillow installed:

```sh
python3 test/ui-audit/build-inspection.py \
  --audit ../docs/frontend-redesign/audit/learn-populated-before \
  --audit ../docs/frontend-redesign/audit/learn-verified \
  --output /var/tmp/ultimafia-new-inspection
```

The output directory must be new. The manifest links each thumbnail to its
original screenshot, source report and hash, excludes failed cases and never
marks images inspected or accepted automatically. Contact sheets are inspection
aids, not new coverage cells or stitched phone evidence; check original images
or native crops for details that desktop thumbnails cannot establish. Refuse
empty reference baselines: the master bootstrap must use the same public source
records, not hard-coded empty achievement/item lists. Source-contract and browser
population assertions guard this explicitly.

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
which now have a separate `live-public` run. The upstream-integrated run paired
all then-registered 582 cells with no gaps and 270 open candidates. The registry
has since expanded to 888 cells with explicit administrative, Rules, Mafia
reference and profile-report states. The administrative integration run captured all 720 then-registered pairs with zero gaps
and 246 open candidates (94 heading offsets, 152 clipping), before the final
composer correction; it is not final-HEAD evidence or exhaustive inventory. The
completed Learn full comparison pairs all 852 registered cells with zero gaps,
856 pre-classification candidates (94 heading offsets, 762 clipping), and all
438 route cases passing per branch. It predates the final Learn commit and is
not final-HEAD evidence. The corrected focused tab-classification run pairs 120
cells: 662 total findings, 628 intentional and 34 open; its other 732 cells remain
gaps. The report-dialog/composition run pairs 48 cells in the expanded 888-cell
registry; 12 heading-offset candidates remain, and the other 840 cells are gaps
in that focused report. The recovered integrated report pairs all 888 then-registered
cells with zero gaps, 856 total findings, 628 intentional and 228 open (94 heading
offsets, 134 clipping). The original run left 18 gaps from a narrow Learn case;
its replacement uses identical HTML/compiled-JS hashes and bounded tab-scroll
settlement before screenshots, not a production workaround or relaxed clipping
threshold. The original failure and input report hashes remain explicit. This is
interim frozen-bundle evidence, not final HEAD. Non-Mafia
reference/global/game states still need inventory expansion. The
report does not interpret a missing master as a redesign regression. Geometry
candidates require image inspection and classification; automated capture is not
visual acceptance, nor evidence of live authentication or physical-phone behavior.
