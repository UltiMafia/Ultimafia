# UltiMafia client redesign

## Draft — audit and migration in progress

This is the **complete client redesign**, not a cleanup on top of master. It
reworks navigation, lobby/community wall, forums/comments, profiles/families,
moderation, setup/hosting/decks, shop/stock market and game chrome. Shared UI
primitives, licensed icons, production-component fixtures and regression checks
support that work. Gameplay/server contracts and the competitive workspace's
information architecture are not redesign targets.

**Not ready to merge.** Passing captures/tests are not visual acceptance.
Historical `pr-evidence` and numbered `final*` images are not final-HEAD evidence;
the complete screenshot refresh remains outstanding.

### Diff against fetched upstream master

363 files: **+22,055 / −14,976** text lines; 161 added, 169 modified, 33 deleted
(25 binary files). Recomputed against fetched `origin/master` for this slice.

## Current work

- One `UiPage`/`UiPageHeader` implementation, named width/header variants,
  supported-value validation and shared geometry checks. Play, profile and family
  use named shells; Learn detail routes no longer nest legacy shells.
- Explicit native/MUI h1 titles and eight remaining h2/h4/span title imitations
   migrated. Removed legacy header classes and page-specific title CSS cannot be
   reintroduced by the architecture check. Developer API and Invoices now use the
   shared header too. This is not exhaustive every-page/state completion.
- Profiles retain their two-column arrangement and authored colors. Neutral text
  insets repair custom-background contrast. Karma controls sit beside their own
  score; statistics show exact results instead of a decorative pie. The family
  banner remains uploaded-media-only, without a generated fallback gradient.
- Read-only filter metadata stays with the heading, not in a stranded action
  card. A shared compact stat variant keeps all three stock balance values
  together on phones, with currency icons beside their amounts. Old stock-summary
  CSS is removed.
- Developer/owner key directories and Invoices use shared controls and `UiTable`.
  Every record value/action remains readable on phones. Failed reads are not
  successful empty lists; late invoice-filter responses cannot replace newer
  results. Revoke/approve/reject have cancellable dialogs and guarded pending/
  failure states. Tests create no credentials and perform no payment or credit.
- Rules uses the shared comparison table, preserving complete offense labels and
  penalty values on phones. Static policy text remains readable during penalty
  loading/failure/empty states, with retry on failure. Canonical wording is guarded;
  the shared violations read cancels obsolete/unmounted requests.
- Learn reference tabs use continuous shared name/description rows instead of a
  role-card gallery. The named setup `picker` variant retains bounded add/remove
  controls and compact previews. Removed gallery CSS cannot return. Populated
  source fixtures cover all Mafia alignments, modifiers, items, mechanics and
  achievements; a bootstrap contract guard prevents an empty master counterpart.
- Architecture guards reject new alternate icon imports, raw h1 titles, removed
  header paths, unsupported variants and inline shared-surface/header overrides.
   Legacy debt decreased **755 → 617 → 615 → 606 → 602 → 589** with no increases. The remaining
  baseline is debt, not a completed reviewed allowlist.
- The comparative audit records stable IDs, six-cell width/palette coverage,
  actual production geometry, role comparisons, source/bundle/image provenance
  and explicit missing cells. Role medians weight each route once rather than
  allowing a 443-role directory to outweigh other pages.
- Actual master uses its untouched complete Main/providers/routes, not redesign
  components with old colors. New dialogs are paired with documented actual
  ancestors when master lacks them; native prompts are recorded and dismissed,
  not fabricated in screenshots. Fixtures cannot forward service mutations.
- Public **same-existing-database** comparisons remain separate from controlled
  fixtures. No authentication, identity forwarding or database replacement is
  implied by a fixture result.
- Merged current upstream master without rewriting history, preserving transcript
  virtualization, spectator ping names, Settings animation/containment, safe-area
  bar treatment, editor font sizing and updated role artwork. Resolved a measured
  32px Chromium cold-scroll regression with public offset synchronization and
  frame-scheduled measurements. The shared composer's visible-only minimum fixes
  a hidden-view WebKit ResizeObserver warning without sizing its autosize helper.
  Strict browser-error and anchor assertions remain intact.

## Evidence and observed results

- [Audit command/report format](docs/frontend-redesign/audit/README.md)
- [Surface inventory](docs/frontend-redesign/workflow-repair/UI_INVENTORY.md)
- [Exact verification and failures](docs/frontend-redesign/workflow-repair/VERIFICATION.md)
- [UI architecture](docs/frontend-redesign/UI_ARCHITECTURE.md)
- [Read-only public comparison procedure](docs/frontend-redesign/audit/live-public/README.md)

The registered denominator is **852 cells**. Global/game states, menus and further
loading/empty/failure/permission branches still need registration. A complete
registered run would therefore still not establish exhaustive inventory coverage.

| Check | Observed result (scoped runs, not final-HEAD acceptance) |
| --- | --- |
| Five-profile repair | 30/30 route cases; 66 registered cells; contrast and karma adjacency/non-overlap assertions passed |
| Eight-title/summary comparison | 48/48 redesign and 48/48 actual-master route cases; 66 paired cells; 56 unresolved clipping candidates |
| Corrected acknowledgement workflows | 18/18 redesign cases; rapid cancel/reopen/Back checks passed using the unchanged Back handler; corrected master driver separately captured 18/18 cases |
| Newly added routes | 42 paired cells across Glossary, developer/owner/denied, invoices/denied and Welcome |
| Public same-database comparison | 48/48 cases, 24 paired cells, 96 separate top/bottom images; 56 public source responses all HTTP 200 |
| Upstream-integrated comparison before administrative expansion | 582/582 redesign cells and 582/582 master cells; 582 pairs, zero gaps, 270 open candidates; inventory remained incomplete |
| Administrative/new-page focused comparison | 36/36 redesign and 36/36 master route cases; 174 paired cells; four remaining Rules clipping candidates. Subsequent invoice-contract correction requires refreshed data evidence |
| Frontend Node tests | 260 passed, 0 failed |
| Controls / lifecycle | 57 checks and 39 states / 33 checks passed |
| Game / competitive / homepage | 36 / 16 / 10 cases passed |
| Build / UI architecture / scoped ESLint | Passed / passed / 0 errors, 28 existing Roles/achievement-hook warnings across the five-file Learn slice (tooling separately reports a stale browser database) |
| Transcript windowing | 19/19 script/engine runs passed across Chromium and WebKit, including strict reflow/settings error checks; added composer/helper assertions passed in both engines |
| Transcript comparative capture matrix | 6/6 repaired and 6/6 actual-master cells passed; pre-repair redesign reproduces the 32px failure in both 390px palettes |
| Expanded full comparison | **720/720 redesign and 720/720 master cells; 720 pairs, zero gaps, 246 open candidates** (94 heading offsets, 152 clipping). All 438 route cases passed per branch. Built before the last composer correction, so not final-HEAD evidence |
| Corrected Rules comparison | **12/12 redesign and 12/12 master route cases; 42 paired cells**, including all 30 newly registered Rules-state cells; 22 unresolved geometry candidates. Inspected all newly unique corrected-label images after the 264-image initial Rules inspection |
| Shared violations consumers | 12/12 route cases passed across profile reporting and staff report detail; select/cancel, deferred unmount/reopen and no report-write assertions passed |
| Learn/setup/new-page comparison | **18/18 redesign and 18/18 actual-master route cases; 120 paired cells**, including populated achievements in both branches after correcting master's stale bootstrap. 662 geometry candidates remain in this focused report; the expanded full run remains pending |
| Selected reference tabs / keyboard | 12/12 cases passed; complete text labels and usable visible hit areas fit their scroll windows, and keyboard navigation reaches first/last sections. Neighboring blank tab padding is not misreported as clipped text |
| Backend suite | Failed isolated attempts: 821 passed/80 failed, then 994 passed/145 failed; worker heap exhaustion and a Mocha parallel-reporter crash remain unresolved. No server/game-engine changes were made to force a pass |

Selected slice images/contact sheets and native-size summary crops were inspected.
All 18 transcript comparison images were inspected through width-specific sheets
and selected native images. Administrative before images and selected repaired
phone/dialog/loading captures were also inspected.
This is not inspection or acceptance of every route, master counterpart, dialog
and global-state image. Speculative navigation changes made while diagnosing a
selector failure were discarded; the existing Back handler is unchanged.

## Still required

- Complete stable-ID registration and both-baseline coverage for every surface,
  state and interaction; retain before/after evidence for each repair.
- Finish remaining header/shell/control/surface/icon migrations and remove their
  legacy CSS/implementations. No baseline regeneration to hide violations.
- Inspect every image; fix/classify all high/medium findings, including genuine
  clipping versus reachable scroll-managed tabs. Resolve remaining role/shell
  inconsistencies against both peers and actual master.
- Finish the broken-layout and workflow sweep, including known birthday, reply
  editor and profile-game-row examples without treating them as the scope.
- Complete final-HEAD full-matrix and interaction verification, then
  refresh every PR image and replace interim results with the final report.
- Authenticated hosting, trading/purchases, family/staff administration and
  destructive moderation were not performed. Physical-phone keyboard/chrome/
  safe-area behavior for this redesign remains unverified.

```sh
cd react_main
node --test test/*.test.mjs
npm run lint:ui
npm run build
DESIGN_PHASE=after npm run audit:ui
```

The audit needs isolated Playwright/Chromium and an untouched actual-master
worktree. Fixture builds use fake public Firebase configuration and `--no-env`,
not credentials. Keep this PR **open and draft**; no production merge or
deployment is requested.
