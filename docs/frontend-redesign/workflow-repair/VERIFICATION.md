# Redesign audit verification — in progress

PR #3197 is open and draft. This is not visual acceptance or a completed audit.
Numbered historical evidence directories are not final-HEAD verification.

## Active audit classification and integrated Learn results

- Completed `../audit/learn-integrated/`: **852/852 redesign cells, 852/852 actual-master
  cells, 852 pairs, zero gaps** in the registered matrix. All **438 route cases per
  branch passed**. Its **856 pre-classification candidates** comprise 94 heading
  offsets and 762 clipping findings. Registration still omits global/game states;
  this dirty-source run predates the final Learn commit, not final-HEAD evidence.
- Clipping measurements now retain numeric pixels, original boxes and named
  control/tablist identities. Master comparison matches that target, never the
  first unrelated clipped control. Missing/ambiguous targets remain explicit.
- The corrected focused run `../audit/reference-tab-classification-corrected/`
  passes **18/18 redesign and 18/18 master route cases**, pairing **120 cells**.
  It retains **662 total findings: 628 intentional tab-window findings and 34
  open setup-editor findings**. Its other 732 inventory cells remain gaps in this
  focused report. Do not subtract these classifications from the older full run
  as though that run had been remeasured.
- The named `reference-tab-scroll-window` rule is limited to Learn tabs with a
  matched master target, overflowing MUI scroll window, visible enabled arrow and
  passing selected-label/hit-area/keyboard contract. All 628 classified targets
  are unselected neighboring tabs. Findings, geometry, master deltas and written
  reasons stay visible; other surfaces and clipped selected labels stay open.
  The first classification attempt found zero intentional findings because the
  clipping ancestor was MUI's root rather than its scroller; retained diagnostics
  are in `../audit/reference-tab-classification/`. No production workaround was
  made for this measurement issue.
- Inspected all 80 original Learn sheets (696 images / 634 unique hashes), including
  superseded empty-master diagnostics, and all 14 newly unique corrected sheets
  (111 hashes) in `/var/tmp/ultimafia-learn-new-images/`. This includes populated
  master achievements, composition fixture and separate phone bottoms. These sets
  overlap; their totals are not additive coverage. Desktop thumbnails establish
  composition, not all native text detail. The setup editor's 320px sticky-step
  overlap remains open, although Add succeeds after scrolling. No visual acceptance.
- Latest tooling verification: **262 Node tests passed, 0 failed** using
  `node --test test/*.test.mjs`; `/var/tmp/ultimafia-tab-classification-node-verified.log`.
  `npm run lint:ui` and `git diff --check` passed. No production UI is changed by
  classification. The fork's subsequent Back-dismissal navigation fix was then
  fast-forwarded without rewriting history; its integrated verification follows
  in the next slice rather than being inferred from earlier captures.

## Preceding Learn directory/picker slice

- Shared `UiReferenceList`/`UiReferenceEntry` replace the role-card gallery with
  continuous directory rows. Names, original artwork and complete descriptions
  remain together. The named `picker` variant preserves the setup editor's
  bounded, scrollable add/remove controls and compact previews. Role/modifier
  filters are unchanged; mechanics now composes the same search/list path.
- Learn items and achievements use the same continuous directory, not a separate
  framed table/gallery. Shared type/tabs/fields replace the migrated direct MUI
  paths. Reference section tabs and panels have linked IDs; the phone achievement
  icon no longer opens a hover popover on synthetic mouseenter while scrolling.
- Removed the old `.cell-search-grid`, `.cell-search-item`, `.role-cell*` CSS and
  setup-specific gallery overrides. Architecture guards reject their return,
  external `.ui-reference*` overrides and unsupported list variants. Independently
  checked debt **602 → 589**, zero increases. The new-page fixture composes both
  reference variants with full directory paragraphs and a real picker action.
- Expanded the formerly thin fixtures using public static source data: **165
  modifiers, 33 game settings, 35 items, 83 achievements**. No account/database
  records were replaced. All five Mafia alignments and reference tabs/categories,
  search and no-results expand the registry **750 → 852 cells**. Non-Mafia and
  global/game workflow registration remains incomplete.
- Corrected populated BEFORE pairs **114 cells** at all widths/palettes. The first
  master attempt failed a test that omitted its passive `/api/user/online` write;
  no service mutation was forwarded. The corrected run is in
  `../audit/learn-populated-before/`; failed originals are retained diagnostics.
- The updated new-page/focused AFTER matrix passes **18/18 redesign and 18/18
  actual-master route cases**, pairing **120 cells**; **662 geometry candidates**
  remain in this focused report, many repeated tab-window candidates. They are
  not silently suppressed. `../audit/learn-verified/` is dirty-source slice
  evidence, not final-HEAD evidence. The completed integrated run is recorded above.
- Image inspection then exposed the master's stale empty `/api/achievements`
  bootstrap despite the shared populated fixture. Corrected it to the same public
  achievement source and recaptured **12/12 BEFORE master and 18/18 AFTER master
  cases**. New source-contract and browser-count guards reject this mismatch.
  Previous empty-master achievement images remain diagnostics, not matching-data
  evidence. The counts above refer to the refreshed latest report pointers.
- Strengthened selected-tab/keyboard checks pass **12/12 cases** across Learn and
  the new-page fixture in both palettes/all widths. Text ranges and a minimum
  usable visible hit area are checked: MUI may scroll blank tab padding behind
  an arrow without clipping its label. An initial whole-button-box assertion
  incorrectly rejected that case; it was corrected, not patched in production.
- Inspected every first repaired Learn/setup image through sheets 53–80 in
  `/var/tmp/ultimafia-learn-inspection/`, including separate phone bottoms in both
  palettes. Desktop thumbnails establish composition, not native text detail.
  Before/master and newly updated fixture inspection was completed as recorded above.
  No visual acceptance is claimed. The 320px initial picker partly overlaps the
  sticky step controls; the actual add action is reachable after scrolling in
  the passing full creator interaction. Keep this distinction explicit.
- `python3 test/ui-audit/build-inspection.py --audit <audit-root> ... --output
  <new-directory>` builds hash-deduplicated inspection sheets with original-image
  provenance, excludes failed cases and never marks visual acceptance. It requires
  Pillow and refuses an existing output directory. The current three-run set
  contains 1,182 images / 698 unique hashes / 88 sheets; that generated manifest
  does not mark inspection or acceptance. Manual inspection is recorded separately.

| Learn check | Observed result |
| --- | --- |
| Frontend Node tests | **260 passed, 0 failed**; `/var/tmp/ultimafia-learn-node-final.log` |
| `npm run lint:ui` | Passed; independently verified baseline 589, no increases |
| Production build | Passed; `/var/tmp/ultimafia-learn-production-build.log` |
| Scoped ESLint | **0 errors, 28 warnings** across CellSearch, Roles, Achievements, UiReferenceList and Learn/Games; `/var/tmp/ultimafia-learn-eslint.json`. Existing Roles/achievement-hook warnings are not called passing full-site lint |
| Controls / retained lifecycle | **57 checks, 39 states / 33 checks passed**; `/var/tmp/ultimafia-learn-{controls,lifecycle}.log` |
| Game / competitive / homepage | **36 / 16 / 10 cases passed**, no recorded failures; `../audit/learn-regressions/` |

Also merged the fork's concurrent change titled “fix(chat): reveal a surface
behind a swiped message again” without rewriting its history. The rejected
initial push was retried only after fetching and merging. The above fresh builds
and regression fixtures include its CSS; no speculative gameplay change was
made to integrate it.

## Preceding Rules/table slice

- Rules penalty tables now use `UiTable variant="comparison"`; desktop values
  remain centered, while phone records keep each complete offense label beside
  its value. The last columns are no longer hidden in a local horizontal table.
  The shared mobile label minimum was corrected after image inspection caught
  `2nd Offense` wrapping. Geometry checks cover every penalty cell and label.
- Static rules remain available during the violations read's loading, failure and
  empty states; failed reads offer Retry. Shared tabs/panels have explicit linked
  IDs. All 17 canonical rule sections retain their original wording, guarded by a
  canonical-data hash test. No policy/server contract was changed.
- `useViolations` now exposes reload, cancels superseded/unmounted reads and
  rejects stale responses with `LatestRequest`; existing error alerts remain.
- Architecture guards reject unsupported table variants, inline table overrides
  and external `.ui-table*` CSS. Independent HEAD-to-working-tree comparison found
  **606 → 602**, with **zero increases**. Shared table variants are documented in
  `react_main/src/components/ui/README.md`.
- Registration expands **720 → 750 cells**. Rules BEFORE and corrected AFTER each
  pair 42 cells across both palettes at 1440/390/320, including appeal, other
  policies, loading, failure, empty and the invoice permission redirect. Corrected
  AFTER passes **12/12 redesign and 12/12 actual-master route cases**; 22 geometry
  candidates remain, principally scroll-managed tabs, not silently accepted.
  Reports: `../audit/rules-before/`, `../audit/rules-labels-corrected/`.
- Inspected the 264 initial Rules before/after/master images through 116 unique
  hashes in 16 inspection sheets, then all six newly unique corrected-label
  images. These are slice inspections, not exhaustive global inspection or
  final-HEAD evidence. No screenshots are described as visual acceptance.

| Rules check | Observed result |
| --- | --- |
| Frontend Node tests | **258 passed, 0 failed**; `/var/tmp/ultimafia-rules-node-final.log` |
| `npm run lint:ui` | Passed; independently verified baseline 602, no increases |
| Production build / scoped ESLint | Passed / **0 errors, 0 warnings** across Rules, useViolations and UiTable; `/var/tmp/ultimafia-rules-{production-build,eslint}.log` |
| Controls / retained lifecycle | **57 checks, 39 states / 33 checks passed**; `/var/tmp/ultimafia-rules-{controls,lifecycle}.log` |
| Game / competitive / homepage | **36 / 16 / 10 cases passed**, no recorded failures; `../audit/rules-regressions/` and `/var/tmp/ultimafia-rules-{game,competitive,homepage}.log` |
| Shared violations consumers | **12/12 route cases passed** across profile report and staff report detail, all widths/palettes. Selection/completion cancellation sends no report write; deferred report-dialog reads can unmount and reopen. `../audit/rules-consumers-corrected-{dark,light}/`; initial selector failures used an abbreviated rule name, not the actual source label, and are retained as diagnostics |

## Preceding upstream integration and administrative/transcript slice

- Merged fetched upstream master without rewriting history. This preserves its
  transcript virtualization, spectator ping names, Settings animation/containment,
  safe-area paint, editor font sizing and role artwork. No backend source differs
  from fetched master (`git diff origin/master --name-only -- Games modules db
  routes lib test` is empty).
- Developer API (including owner/denied views) and Invoices now use shared page
  headings, controls and `UiTable`. The table keeps every value/action in labeled
  continuous phone records instead of clipping the rightmost columns. Read
  failures have explicit retry states, not successful empty lists. Invoices reject
  late responses from earlier filters. Revoke/approve/reject use cancellable shared
  dialogs with pending guards and retained inline errors; failed key creation
  retains its name. Endpoint methods/payloads and server eligibility are unchanged.
- Registered administrative pending/error/empty states expand **582 → 720 cells**.
  Synthetic invoice status/eligibility rules now match the source literals in
  `modules/cryptoPayments.js`, checked by reading them, never importing its database
  module. The initial fixture incorrectly treated Unpaid as a status; it is a
  filter group. Those older captures are retained as diagnostics, not final data
  contracts. No credentials were generated and no payment/credit was performed.
- Resolved the merged redesign's Chromium 32px cold-scroll regression through
  TanStack's public offset observer plus frame-scheduled measurement. The iOS
  held-correction path does not adopt native offsets. Following-only viewport
  commands are frame-scheduled and canceled on cleanup. A separate WebKit warning
  was traced to the shared composer shrinking while hidden: its one-row minimum
  now excludes MUI's aria-hidden autosize helper. No browser errors are filtered
  and no anchor tolerances were relaxed.
- New-page composition now includes a long-identifier responsive table and labeled
  select. Architecture debt shrank **615 → 606**, independently checked with zero
  increases. Existing controls/surfaces elsewhere still require migration.
- `/tmp`'s per-user quota interrupted one fixture build despite free filesystem
  space. No evidence/builds/worktrees were deleted. New output uses disk-backed
  temporary directories; fixture bundles no longer duplicate the public archive
  already served read-only by the runner. Bundle-directory overrides also let the
  regression runners use immutable disk-backed builds.

| Latest check | Observed result |
| --- | --- |
| Upstream-integrated comparative run, before this slice | **582/582 redesign, 582/582 master, 582 pairs, zero gaps, 270 open candidates**; `../audit/upstream-integrated/coverage.json`. Inventory remained incomplete |
| Administrative BEFORE | 30 redesign and 30 master route cases; 30 pairs in the then-582 denominator; both palettes at 1440/390/320 |
| Corrected focused administrative/new-page matrix | **36/36 redesign and 36/36 master cases**, **174 paired registered cells**, four remaining Rules-tab clipping candidates; `../audit/admin-reference-corrected/`. Later invoice-contract corrections require refreshed data evidence |
| New full comparative run | **720/720 redesign cells, 720/720 master cells, 720 pairs, zero gaps, 246 open candidates** (94 heading offsets, 152 clipping); all **438 route cases passed per branch** in `../audit/admin-integrated/`. Built before the final composer-minimum correction, not final-HEAD evidence |
| `node --test test/*.test.mjs` | **256 passed, 0 failed**; `/var/tmp/ultimafia-admin-contracts-node-tests.log` |
| `npm run lint:ui` | Passed; legacy budget 606, no increases |
| Production build / scoped ESLint | Passed / **0 errors, 0 warnings** across DeveloperApi, Invoices, UiTable and WindowedTranscript; `/var/tmp/ultimafia-ui-current-{production-build,eslint}.log`. Tooling separately warns that its browser database is stale |
| Controls / retained lifecycle | **57 checks, 39 states / 33 checks passed**; `../audit/admin-transcript-regressions/` |
| Game / competitive / homepage | **36 / 16 / 10 cases passed**, no recorded failures; same regression directory |
| Windowing scripts | **19/19 script/engine runs passed**: nine selectable scripts on Chromium 158.0.8127.18 and WebKit 27.2, plus WebKit-only obituary comparison. `/var/tmp/ultimafia-final-windowing-*.log` |
| Added composer/minimum assertions | Reflow passed again on Chromium and WebKit with explicit one-editor/one-row and zero-minimum-helper assertions; `/var/tmp/ultimafia-visible-composer-asserted-*.log` |
| Cold-scroll comparative capture matrix | **6/6 repaired and 6/6 actual-master cells passed** at all widths/palettes. Preserved pre-repair redesign fails both 390px palettes and passes the other four cells. `../audit/transcript-offset-frame-native/` |
| Backend | Still the failed isolated attempts documented below; no server/game-engine changes made to force passing results |

The cold-scroll driver now verifies it reached middle history. Desktop needs a
native wheel action to leave its initial end command; a programmatic-only desktop
probe failed identically on actual master and redesign and is retained separately
as superseded diagnostics. Mobile WebKit has no wheel support, so its original
programmatic cold-seek test is preserved. All displacement/bounded-DOM/browser-error
assertions remain strict.

Inspected all 18 transcript before/after/master images through three width-specific
contact sheets, plus selected native-size images; desktop thumbnails establish
composition, not native-size text inspection. Inspected the administrative BEFORE
matrix through 12 contact sheets and selected repaired phone/dialog/native-size
images, including the refreshed invoice eligibility and visible loading indicator.
This is not inspection of every full-inventory image or visual acceptance. The
latest runs have dirty-source provenance and are not final-HEAD PR evidence.

## Earlier presentation slices

- Third slice: Rules, Terms, Privacy, Competitive FAQ, Hall of Fame, competitive
  standings, Learn and Stock Market now use the shared page header instead of
  h2/h4/span title imitations. Hall-of-Fame filter metadata is continuous text,
  not a stranded action-card. The stock balance summary uses `UiStatRow`'s named
  compact variant; its old page-specific summary component/CSS is removed.
- Stat-label CSS now targets the direct label, not nested currency spans. Native
  1440/390/320 crops in both palettes confirm coins stay beside their amounts;
  the browser runner asserts the amount/icon alignment as well as bounds.
- Registered seven previously missing route/permission variants (Glossary,
  invoices/denied, developer/owner/denied, Welcome) and four acknowledgement
  dialog/editor states. The denominator is now **582 cells**, still not an
  exhaustive global/game-state inventory. This was the then-current denominator;
  the latest registration above expands it further.
- Second slice: Play, profile and family now use named `UiPage` shells; Learn
  details no longer nest a second legacy shell. Profile identity uses the same
  header with a keyboard-accessible name-history action. Supported widths and
  header variants are validated statically and at runtime.
- Custom profile backgrounds remain visible, with neutral insets for identity,
  bio and reputation text. Statistics use a shared neutral `UiCard` and exact
  win/loss/abandon counts, not a decorative pie chart. Karma controls now sit
  beside their own score. Image inspection caught an overlapping-arrow attempt;
  it was corrected and the focused matrix rerun with a non-overlap assertion.
- Actual-master task captures now include host/reply/trade/rating dialogs,
  setup tabs, profile sections, failed feedback submission, and family bio/native
  confirmations. Native prompts are recorded and dismissed; ancestor screenshots
  are explicitly not screenshots of browser-native dialogs. The fixture never
  forwards these writes to a service.
- `UiPage` and standalone `UiPageHeader` now use one header implementation.
  Standard/editor/moderation/forum/detail share the title scale; the editor
  variant stacks controls on phones. The removed `page-heading`,
  `forum-directory-heading`, `moderation-heading`, `setup-editor-heading` and
  `deck-editor-heading` CSS paths cannot be reintroduced by the architecture check.
- Native/MUI explicit h1 implementations migrated to the shared header, except
  the reviewed existing mobile **Game info** panel. This does **not** mean every
  legacy h2 or section-like page heading has completed migration.
- The comparative audit measures production header/container/shell geometry,
  role-based computed styles, clipping candidates and one-character wrapping.
  It records source revision, dirty-source status, bundle/image hashes and
  explicit missing coverage. It does not count failed fixture contracts.
- The new-page fixture composes shared primitives without page-specific CSS.
  A reduced-matrix CI workflow builds the real fixture and checks geometry in
  both palettes at 1440/390/320.
- The actual-master fixture renders upstream's complete `Main`, providers,
  original shell and route tree. The runner verifies its source is untouched and
  exactly the fetched `origin/master`, not an older redesign revision.
- The fork's uploaded-banner-only family change was fast-forwarded before these
  edits. No generated gradient/banner is shown for an absent family banner.
  The profile remains the restored two-column layout, not the intermediate
  dashboard described by the previous verification document.

## Observed commands/results

| Command / run | Observed result |
| --- | --- |
| `git fetch origin master`; `git fetch fork redesign/workflow-repair-draft`; `git merge --no-edit fork/redesign/workflow-repair-draft` | Fast-forwarded the fork's uploaded-banner-only family change; no history rewrite |
| `gh pr view 3197 --repo UltiMafia/Ultimafia --json state,isDraft,headRefName,headRepositoryOwner,baseRefName` | OPEN, draft, expected fork/branch/base |
| `node --test test/*.test.mjs` | Latest title/summary slice: 239 passed, 0 failed; log `/tmp/opencode/audit-title-final-node-tests.log`. Earlier shell/profile: 238 passed; first header slice: 236 passed |
| `node --test test/uiArchitecture.test.mjs test/uiAudit.test.mjs` | Included in the full passing run, including rejected baseline-expansion commands and page-specific h1 CSS |
| `npm run lint:ui` / architecture test | Passed; raw titles, computed legacy header classes, alternate icon imports and external page-geometry overrides are guarded |
| `node scripts/check-ui-architecture.cjs --reduce-baseline` | Budget decreased from 755 to 617; independent comparison found zero increases |
| `npm run build` | Passed after the final redundant-CSS removal; log `/tmp/opencode/audit-code-slice-production-build.log` |
| Scoped ESLint across changed production JS/JSX | 0 errors, 80 warnings; log `/tmp/opencode/audit-current-eslint.log` |
| First measured BEFORE, both palettes | 384/384 route cases captured; no failed renders; 64 routes × 3 widths × 2 palettes |
| First header AFTER, both palettes | 390/390 route cases captured; no failed renders; includes new-page fixture. Inspected images exposed stretched detail metadata and doubled router-shell header spacing, subsequently corrected |
| Corrected header AFTER, both palettes | 390/390 route cases captured, 0 failures; shared header geometry assertions passed; compact detail badge and corrected spacing inspected at 320 in both palettes |
| Final header focused matrix after removing redundant external h1 CSS | 54/54 cases captured, 0 failed renders; `/tmp/opencode/audit-header-focused-sourcecommit/`. Its aggregate command exits 1 because the full denominator remains 510 and master pairs are not supplied to this reduced run |
| Master smoke: Players, Host, thread, profile settings; dark; 1440/390/320 | 12/12 cases captured from actual upstream production components with identical controlled records |
| Full shell-contract comparison | 516/516 redesign cells and 510/516 master pairs; six missing feedback cells because its MUI autosize helper textarea made the old selector ambiguous. The selector was corrected; focused master feedback rerun captured all six widths/palettes plus six submission-error states. Full replacement run is in progress; no claim of final-HEAD coverage |
| Focused profile repair, all five profiles × all widths/palettes | 30/30 route cases, 0 failed renders; 66 registered cells, 96 top/bottom/task images. Contrast, adjacency and non-overlap assertions passed. `/tmp/opencode/audit-profile-contrast3.log`; six remaining identity-header offset candidates are not silently waived |
| Completed shell/profile full comparison | 515/516 redesign cells and all 516 master cells captured. Its one donor-management failure came from a global selector hitting the outgoing assignment dialog's Remove action, not the donor row. Event tracing established the target error; speculative Back-handler changes were discarded and no navigation/game code is changed |
| Corrected acknowledgement workflow | All 18 redesign route cases passed; 42 registered cells. Three immediate assign/cancel/remove cycles and browser Back passed at all widths/palettes with the unchanged production Back handler. Corrected actual-master editor/popover driver separately captured all 18 cases/42 cells; no writes were sent |
| Remaining title/summary matrix | 48/48 redesign and 48/48 actual-master route cases captured, pairing 66 registered cells; no failed renders. 56 clipping candidates remain, chiefly scroll-managed tab controls, not silently accepted. `/tmp/opencode/audit-title-summary-contract.log` |
| Compact stats after currency-span repair | 6/6 route cases, 18 registered states captured; amount/icon baseline assertions passed in both palettes at all three widths. `/tmp/opencode/audit-compact-stats-currency.log` |
| Added-route BEFORE coverage | Six new routes captured all 36 redesign/master cells. Welcome initially exposed a missing fixture route (not missing production UI); adding its actual production route to the fixture gave 6/6 additional paired cells in `/tmp/opencode/audit-welcome-fixed.log` |
| `node test/run-live-ui-audit.cjs` after both live-fixture builds | 48/48 cases, 0 failures; 24 paired public cells, 96 separate viewport images, 56 local source responses all HTTP 200. No authentication or synthetic accounts |
| Lifecycle: `PLAYWRIGHT_MODULE=… node test/run-browser.cjs` after lifecycle fixture build | 33 checks, no failures/errors/blocked traffic; `/tmp/opencode/audit-lifecycle.log` |
| Shared controls: `PLAYWRIGHT_MODULE=… SCREENSHOT_DIR=… node test/run-control-review.cjs` | 57 checks passed, 39 states captured; `/tmp/opencode/audit-controls.log` |
| Game layout: `GAME_LAYOUT_OUTPUT_DIR=… node test/run-game-layout-review.cjs` | 36 cases, no failures; `/tmp/opencode/audit-game-layout.log` |
| Competitive: `PLAYWRIGHT_MODULE=… COMPETITIVE_OUTPUT_DIR=… node test/run-competitive-game-review.cjs` | 16/16 passed, no errors; `/tmp/opencode/audit-competitive.log` |
| Homepage: `PLAYWRIGHT_MODULE=… HOMEPAGE_OUTPUT_DIR=… node test/run-homepage-restoration.cjs` | 10 cases passed; `/tmp/opencode/audit-homepage.log` |
| Backend: isolated `docker compose … run --rm tests` (`npm test -- --jobs 4 --reporter dot`, then jobs 2) | **Failed**, not passing verification: first attempt 821 passing/80 failing after disposable MongoDB hit its descriptor limit and crashed. Retry with nofile 65536 and writable temporary logs: 994 passing/145 failing; MongoDB stayed up, but a worker exhausted its 4GB heap and Mocha's parallel failure reporter threw `test.titlePath is not a function`. Logs `/tmp/opencode/audit-isolated-backend-tests.log` and `…tests2.log` |
| `git diff --check` | Passed before this documentation update |

Latest shell/profile regression reruns all passed after the arrow-layout repair:
production build; architecture check; 238 Node tests; 57 control checks/39 states;
33 lifecycle checks; 36 game-layout cases; 16 competitive cases; 10 homepage
cases. Logs are `/tmp/opencode/audit-shell-{production-build,node-tests,controls,
lifecycle,game-layout,competitive,homepage}.log`. Scoped ESLint reported 0 errors
and 61 warnings before the final unused-import removal (not full-site lint).

Title/summary slice regression reruns also all passed after the currency fix:
production build, 239 Node tests, 57 controls/39 states, 33 lifecycle checks,
36 game-layout cases, 16 competitive cases and 10 homepage cases. Logs:
`/tmp/opencode/audit-title-final-*.log`. Scoped ESLint across its nine production
JSX files: **0 errors, 21 warnings**. Architecture check passed and the debt
budget shrank **617 → 615**, independently checked with zero increases.

The audit command intentionally exits nonzero for missing cells or open findings.
The first report counted 492/510 redesign cells, 0 master cells and 448 candidates.
The first header-after report counted 498/510 redesign cells and 318 candidates.
These are diagnostic snapshots, **not** final counts; the inventory still needs
expansion. The family removal/bio interactions have now gained explicit captures.

## Evidence and inspection

- Generated inventory, coverage, findings, measurements, report and capture
  manifest: `../audit/`. Each capture set has its own immutable `run-*` directory.
- Top and separately scrolled bottom phone images are retained. Inspection aids
  are contact sheets, never stitched mobile evidence or additional matrix cells.
- Inspected the initial migrated Players, Families, Host, deck editors, setup
  editor/detail, role detail, forums, staff handbook, family profile and new-page
  fixture in dark desktop/390/320 contact sheets, plus selected native-size before
  images. Light desktop/320 top/bottom contact sheets were also inspected for
  Players, Families, Host, setup editor, role detail, board, handbook and family.
  Selected corrected-header 320 images were inspected in both palettes, and the
  real same-data lobby master/redesign pair was inspected at 320 light. This is
  **not** inspection of every capture.
- Master source is the upstream change titled “fix(game): animate the Settings
  menu again and keep it inside the panel” (`989a014c438dd0670477650d11481bb686735ebe`).
- Current captures have dirty-source provenance; they are not labeled final HEAD.
  Final images must be recaptured after the final code commit.
- Inspected all 96 images in the corrected five-profile focused run through 16
  contact sheets, including separate phone bottoms, and selected native-size
  custom-profile/320 images. Desktop thumbnails establish composition only;
  this does not establish native-size inspection of every desktop detail or
  inspection of the full global inventory. The overlapping-arrow attempt remains
  retained as superseded diagnostics.
- Inspected title-slice desktop/390/320 top images in both palettes and separate
  390/320 bottoms. Follow-up summary images exposed the nested coin-span style
  defect; after fixing it, all six native-size summary crops were inspected.
  These are slice inspections, not inspection or acceptance of every master,
  interaction and global-state image.

## Local environment and genuine limits

- Running MongoDB uses `ultimafia_mongodb:/data/db`; Redis uses
  `ultimafia_redis:/data`. No data volumes were created, replaced, reset or pruned.
- Existing local web APIs returned JSON HTTP 200 for `/api/user/online`,
  `/api/setup/search?gameType=Mafia` and `/api/roles/all`. The online list was
  empty at that check; that is not evidence the database is empty.
- Controlled fixture writes remain in memory. The live-public proxy permits
  GET/HEAD only, forwards no identity headers/cookies and never persists response
  bodies. Its screenshots are public guest pages, not authenticated workflows.
- Sign-in, live hosting/trading/purchasing, family administration and destructive
  moderation remain unverified. No authentication-project setting was changed.
- Physical-phone keyboard, browser chrome and safe-area behavior remain
  unverified. Chromium viewports do not establish those results.
- Full current-HEAD PR screenshot refresh still needs a final run. The browser
  regression suites above have been rerun for this slice, not for future edits.
- The backend failure remains unresolved. `git diff --name-only HEAD -- Games
  modules db routes lib test` was empty: this slice changed no backend source or
  tests. That is evidence of scope, **not** a claim master passes or that every
  reported backend failure is pre-existing. No gameplay/server change is made
  to turn those results green. Disposable test MongoDB/Redis are separate from
  the user's original development volumes.

## Still required before completion

Expand the stable-ID inventory to every global/workflow state; complete paired
master coverage (including live same-database evidence and explicit nearest
ancestors for new surfaces); inspect every image; resolve/classify every
high/medium candidate; migrate all remaining legacy controls/surfaces/page-title
paths; finish role/shell checks; run all required suites; commit/push; refresh PR
images and description from final code. The PR must remain open and draft.
