# Comparative UI audit

Run `cd react_main && ROUTE_CASES=<changed-routes> npm run audit:ui`. Set `PLAYWRIGHT_MODULE` to an isolated
Playwright installation; the existing `/tmp/opencode/redesign-tools/node_modules/playwright`
is the local default. Install Chromium for that Playwright version first. The
fixture build uses `--no-env`, a fake public Firebase project and in-memory reads
and opted-in writes; it cannot submit to live services.

## Scope: the redesign against itself, not against master

This audit grades two things:

- **Absolute usability and layout contracts** that do not need a reference:
  labels clipped by a container, touch-target size, declared-full-width
  shortfalls, adjacent fields, navigation visibility and wrapping, fixed bars
  covering content, horizontal overflow.
- **Consistency across routes**: the same UI role and state graded against the
  reference the other pages establish. This is what keeps `settings`,
  `moderation`, `shop` and the rest in one design language.

It deliberately **does not compare against upstream master.** This branch
replaces master's design, so "differs from master" is not a defect, and the
paired comparison that treated it as one produced thousands of rows whose only
meaning was "not master" — 1,304 padding rows, 586 border rows, 584 height rows
and so on in the last paired run. That comparison was retired on 2026-11-15.
Matched master evidence is not required, not collected and not retained as a
pass criterion. Historical sections below that mention pairs, master deltas or
`not-on-master` describe the retired procedure.

The runner builds each branch once, then captures dark/light at 1440/390/320. Top and scrolled
bottom are separate viewport images, not stitched phone pages. It measures the
actual production components and records bundle hashes, source revision and
whether tracked source had uncommitted changes. Never label a dirty capture as
final-HEAD evidence.

`inventory.json` enumerates stable route/state IDs. `coverage.json` has the full
six-cell denominator per ID, including uncaptured states. `measurements.json`
records header/container geometry, shell widths/offsets and role-based computed
styles. `findings.json` and `report.html` expose absolute-contract failures plus
geometry candidates with cross-route peer medians. `capture-manifest.json` hashes
the images. `role-comparisons.json` groups every observed style by UI role and
property, retains its selectors and compares it with the cross-route reference.
Each peer route contributes once; a 443-row directory cannot overweight a
single-field form. These comparisons remain `requires-review`, not
automatically accepted differences.

The command **fails** if coverage is incomplete or findings remain open. Cells
nothing captured are `missing`; that is a gap in this run, not an exemption.

Clipping values are numeric pixels with the original control/container boxes.
The versioned `test/ui-audit/intentional-differences.json` contains narrow, named
review rules. The Learn tab-window rule requires an overflowing MUI window, an
enabled visual arrow, complete selected labels/usable targets and passing
first/last keyboard checks. It does not exempt other surfaces or ordinary
controls. Intentional findings retain geometry, screenshots and their reason in
JSON/HTML. Summary counts distinguish total, intentional and open; classification
never means visual acceptance or creates missing coverage.

## Layout contracts

Two defect classes are graded numerically rather than judged from pixels.

**Fill and content edge.** Every sampled block is compared with the space actually
allocated to it: the parent's content box, a resolved grid track, or an aligned
section content edge reached by following aligned wrappers. A shortfall only
becomes a finding when there is evidence that wider space was available — a
wider aligned sibling, a section rule or divider spanning further right, or a
declared full-width intent (`data-ui-fill="full"`, `MuiFormControl-fullWidth`,
`MuiButton-fullWidth`). Tolerance is 8px. Properties:
`declaredFullWidthShortfall`, `contentEdgeShortfall` and
`fillMeasurementUnavailable`.

Not every candidate is measurable: a flex-row allocation without an explicit
track contract, an unresolved grid track, or a hidden element is recorded as
`unmeasurable` in `measurement-coverage.json` and **not** raised as a finding,
unless the element declares full width — in that case the missing measurement is
the defect. Label-, icon- and text-sized roles are intrinsic and never count as
short: `primaryAction`, `secondaryAction`, `utilityIcon`, `currency`, `tab`,
`sectionNavItem`, `sectionHeading`, `tableHeader` and `emptyState`. A status line
is text, not a block.

**Form controls.** Two elementary defects are checked directly rather than
inferred: `touchingFields` for adjacent form controls with less than 4px between
them, and `labelClippedByContainer` for a floating label whose nearest scrolling
ancestor starts below the label's top edge. Both are high severity. They exist
because both defects shipped in this branch and neither was visible to the
comparative geometry rules.

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

A shortfall is a measurement, not a verdict: the value, boxes, container and
evidence are retained for review.

For iteration, use `ROUTE_CASES=players ROUTE_WIDTHS=320 npm run audit:ui`.
Interim capture requires an explicit route scope and defaults to a **120-image
budget for the entire command**, across palettes, including failed
diagnostic attempts. Set a smaller `UI_AUDIT_CAPTURE_LIMIT` for small slices.
`ROUTE_CAPTURE_STATES=modifiers,settings` keeps those task images while still
running the other assertions and retaining the complete inventory denominator.
Include `default` to capture initial top/bottom images; otherwise those images are
reused only through explicit input provenance or remain coverage gaps. Direct route runners default to 120 images
per process and accept `ROUTE_CAPTURE_LIMIT`; a manual multi-process slice must
divide its stated total budget across those processes. Reuse identical immutable
bundles where verified. Do not generate fresh full-site matrices for individual
repairs. `UI_AUDIT_FINAL=1` is reserved for the single complete matrix after all
feasible work is genuinely finished.
This deliberately leaves the full denominator unchanged. Regenerate reports
without capturing with `node test/run-ui-audit.cjs --report-only`.
Use `UI_AUDIT_OUTPUT` for an independent run; before/after output folders are
distinct (`DESIGN_PHASE=before` or `after`). Do not rebuild a bundle being served
by another runner.

The runner serves the branch's original public asset directory read-only; the
fixture build does not duplicate its audio/artwork archive. Set
`UI_AUDIT_BUNDLE_ROOT` to an owned disk-backed temporary directory if `/tmp` hits
its per-user quota. Set `TMPDIR` on the command too to relocate browser scratch
files. This is a storage workaround, not permission to delete old builds,
worktrees or evidence.

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
empty reference baselines: the bootstrap must use the same public source
records, not hard-coded empty achievement/item lists. Source-contract and browser
population assertions guard this explicitly.

## Current limits — not completion

The inventory derives from the existing route registry plus its explicit
task captures. It still needs expansion to all global overlays, game states,
menus, loading/empty/permission branches and uncaptured dialogs. Live
same-database public-route captures remain a separate `live-public` run
(`run-live-ui-audit.cjs`), which pairs real public pages side by side for human
inspection and performs no numeric grading.

The historical record below is retained, not deleted, because it documents how
the current contracts were derived and which defects they caught. **Its master
columns, `paired`/`gaps` counts and master-status values belong to the retired
comparative procedure and must not be read as a current pass criterion.** The
last paired run (`/var/tmp/ultimafia-full10`, 2026-11-13) paired 924 cells and
left 4,648 open rows; that number was never a count of distinct defects, and it
is not outstanding work. The 2026-11-15 redesign-only matrix captured 924/924
cells with 0 open findings; it is structural and consistency evidence only
(`visualAcceptance: false`), not visual acceptance.

Geometry candidates require image inspection and classification; automated
capture is not visual acceptance, nor evidence of live authentication or
physical-phone behaviour.
