# UltiMafia client redesign

## Draft — audit and migration in progress

This is the **complete client redesign**, not a cleanup on top of master. It
reworks the site shell/navigation, lobby/community wall, forums/comments,
profiles/families, moderation, setup/hosting/deck flows, shop/stock market and
game chrome. It introduces shared UI primitives, licensed utility icons,
production-component fixtures and regression checks. The competitive game's
panel/information architecture, gameplay logic and server contracts are not
authorized redesign targets.

The PR is **not ready to merge**. Capture/test success is not visual acceptance.
The previous description's claims that the audit had not been built, that the
family always generated a fallback banner, and that older images represented
final verification were stale. They are removed rather than repeated as current
evidence. Final-HEAD screenshots will be refreshed after the last code change.

### Code-slice diff against fetched upstream master

Before adding the audit capture artifacts: **361 files**, 150 added, 50 deleted,
161 modified; **+20,169 / −16,090 lines** (binary files excluded). This is
the code-slice diff, not the final audit-artifact diff.

## Current audit slice

- `UiPage` and standalone `UiPageHeader` use one implementation. The editor
  variant stacks controls on phones; standard/moderation/forum/detail retain the
  same title scale. Native/MUI explicit h1 implementations migrated, with one
  reviewed exception for the existing in-game mobile **Game info** panel.
- Removed `page-heading`, `forum-directory-heading`, `moderation-heading`,
  `setup-editor-heading` and `deck-editor-heading` implementations and their
  page-specific CSS. Guards reject their return, including computed class names,
  raw titles, inline header overrides and external shared-shell/title CSS.
- Direct alternate icon imports are rejected. Legacy-control budgets decreased
  **755 → 617**, with no increases. Baseline regeneration/expansion commands are
  now rejected; remaining entries are debt, not a completed reviewed allowlist.
- Added a comparative audit over real production components: stable route/state
  IDs, six-cell width/palette matrix, heading/shell measurements, role-based
  computed styles, geometry candidates, image/bundle hashes and a linked report.
  Missing master coverage stays a gap; failed fixtures cannot count as captures.
- Actual upstream master is rendered through its **complete Main/providers,
  original shell and route tree**, from an unchanged worktree verified against
  fetched `origin/master`. A previous redesign revision is never its baseline.
- Added separate read-only **same-existing-database public comparisons**. Both
  clients receive the same cached public responses; no identity headers or
  writes are forwarded. Controlled fixtures are labeled separately.
- Added `UI_ARCHITECTURE.md`, a new-page composition fixture without per-page
  CSS, and a reduced-matrix CI geometry/architecture workflow.
- Preserved the restored two-column profile arrangement. The fork's family
  correction now shows a banner only when one was uploaded, without generating
  a sparse gradient for absent media.

## Evidence

- [Audit command, report format and limits](docs/frontend-redesign/audit/README.md)
- [Existing-database public comparisons](docs/frontend-redesign/audit/live-public/README.md)
- [Surface inventory](docs/frontend-redesign/workflow-repair/UI_INVENTORY.md)
- [Exact verification record](docs/frontend-redesign/workflow-repair/VERIFICATION.md)
- [Shared UI architecture](docs/frontend-redesign/UI_ARCHITECTURE.md)

Before, intermediate and corrected-header captures are diagnostic worktree
evidence, not final-HEAD screenshots. Phone top/bottom images are separate
viewports. Only selected images have been inspected; the audit does not claim
that every capture has been visually reviewed.

## Observed verification for this slice

| Check | Result |
| --- | --- |
| First measured before routes | 384/384 captured, no failed renders |
| Corrected-header route matrix | 390/390 captured: 65 routes × 3 widths × 2 palettes; shared-header geometry assertions passed |
| Public same-database comparison | 48/48 cases, 0 failures; 24 paired cells, 96 top/bottom images; 56 source responses all HTTP 200 |
| Frontend Node tests | 236 passed, 0 failed |
| Shared controls | 57 checks, 39 captured states |
| Game / competitive layout | 36 / 16 cases passed |
| Retained lifecycle | 33 checks, no failures/errors/blocked traffic |
| Homepage restoration | 10 cases passed |
| Production build / UI architecture | Passed for the header slice |
| Scoped ESLint | 0 errors, 80 warnings |
| Full comparative audit | In progress; must fail until missing pairs and open findings are resolved |
| Backend suite | Failed: isolated attempts reported 821 passed/80 failed, then 994 passed/145 failed. Raising MongoDB's descriptor limit prevented its crash, but a test worker still exhausted its heap and Mocha's parallel failure reporter crashed. No backend source was changed in this slice; development data services were not used |

These counts are not a completion claim. Historical numbered `final*` folders
are not substitutes for current evidence.

## Remaining work / known limits

- Expand stable IDs and capture tasks to every inventory dialog, tab, popover,
  menu, loading/empty/failure/permission and game state. Complete master pairing
  and explicit nearest-ancestor comparisons for new surfaces.
- Migrate remaining h2/section-like page headings, shells, controls, surfaces,
  dialogs and legacy CSS. The native-h1 migration is not every-page completion.
- Inspect and resolve/classify every high/medium geometry candidate, including
  intentional scroll-managed tabs/hidden hit targets rather than blindly changing
  production behavior to satisfy a detector.
- Complete the known birthday-field, forum-reply-composer and profile-game-row
  repairs within the shared primitives; these are examples, not the audit scope.
- Complete final verification and source-accurate PR screenshot refresh, then
  replace these interim counts with the final report.
- No authenticated hosting, purchases, trades, family administration or
  destructive moderation was performed. Physical-phone keyboard/browser-chrome/
  safe-area behavior is unverified. Visual acceptance is not claimed.

## Reproduce

```sh
cd react_main
node --test test/*.test.mjs
npm run lint:ui
npm run build
DESIGN_PHASE=after npm run audit:ui
```

The audit requires isolated Playwright/Chromium and the actual upstream master
worktree documented in its README. Fixture builds use `--no-env` and fake public
Firebase configuration, not credentials. Live public comparisons additionally
require the existing local backend; they do not seed or replace its database.

Keep this PR open and draft. No production deployment or merge is requested.
