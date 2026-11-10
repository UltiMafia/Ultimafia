# Redesign audit verification — in progress

PR #3197 is open and draft. This is not visual acceptance or a completed audit.
Numbered historical evidence directories are not final-HEAD verification.

## Current changes

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
| `node --test test/*.test.mjs` | 236 passed, 0 failed; log `/tmp/opencode/audit-header-final-node-tests.log` |
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
| `DESIGN_PHASE=after npm run audit:ui` | Full current redesign/master run in progress; see the audit's generated reports, not the older counts above, for completion/failure |
| `node test/run-live-ui-audit.cjs` after both live-fixture builds | 48/48 cases, 0 failures; 24 paired public cells, 96 separate viewport images, 56 local source responses all HTTP 200. No authentication or synthetic accounts |
| Lifecycle: `PLAYWRIGHT_MODULE=… node test/run-browser.cjs` after lifecycle fixture build | 33 checks, no failures/errors/blocked traffic; `/tmp/opencode/audit-lifecycle.log` |
| Shared controls: `PLAYWRIGHT_MODULE=… SCREENSHOT_DIR=… node test/run-control-review.cjs` | 57 checks passed, 39 states captured; `/tmp/opencode/audit-controls.log` |
| Game layout: `GAME_LAYOUT_OUTPUT_DIR=… node test/run-game-layout-review.cjs` | 36 cases, no failures; `/tmp/opencode/audit-game-layout.log` |
| Competitive: `PLAYWRIGHT_MODULE=… COMPETITIVE_OUTPUT_DIR=… node test/run-competitive-game-review.cjs` | 16/16 passed, no errors; `/tmp/opencode/audit-competitive.log` |
| Homepage: `PLAYWRIGHT_MODULE=… HOMEPAGE_OUTPUT_DIR=… node test/run-homepage-restoration.cjs` | 10 cases passed; `/tmp/opencode/audit-homepage.log` |
| Backend: isolated `docker compose … run --rm tests` (`npm test -- --jobs 4 --reporter dot`, then jobs 2) | **Failed**, not passing verification: first attempt 821 passing/80 failing after disposable MongoDB hit its descriptor limit and crashed. Retry with nofile 65536 and writable temporary logs: 994 passing/145 failing; MongoDB stayed up, but a worker exhausted its 4GB heap and Mocha's parallel failure reporter threw `test.titlePath is not a function`. Logs `/tmp/opencode/audit-isolated-backend-tests.log` and `…tests2.log` |
| `git diff --check` | Passed before this documentation update |

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
