# Apply the established redesign: replace and delete log

Branch: `redesign/workflow-repair-draft`
Started: 2026-11-14

This is the working log for applying the already-built design system everywhere,
deleting the alternate paths, and proving no visual regressions.

## Completed slice: legacy card path

The site had two card implementations: `.box-panel` (legacy) and `UiCard` (the
redesign). They could look the same while remaining separate code paths. Removed
the legacy path:

- `pages/User/Profile.jsx`: 11 `<div className="box-panel ui-card">` panels
  replaced with `UiCard`; custom tint moved from inline `panelStyle` to the
  `profile-tinted` variant; header width moved to CSS.
- `components/CasePanel.jsx`: renders `UiCard`, strips legacy `box-panel`/
  `ui-card` tokens, applies the profile tint. It is the card; callers may only
  name a layout variant.
- `components/Scrapbook.jsx`, `RapSheet.jsx`, `PendingTradeConfirmations.jsx`:
  `UiCard` with the `profile-tinted` variant; dead `panelStyle` props removed.
- `pages/Learn/Setup/SetupPage.jsx`: version-history empty states use `UiCard`.
- `components/TrophyCase.jsx`, `Achievements.jsx`: defaults no longer request
  `box-panel`.
- `components/Basic.jsx`: removed the unused `PanelGrid` (`box-panel`) export.
- Deleted `.box-panel` CSS from `css/main.css`, `css/user.css`,
  `css/moderation.css`, `css/setupPage.css`, `components/ui/ui.css`.
- `grep -R box-panel src` now matches only the CasePanel guard/comment.

Verification:

- `npm run lint:ui` passes; scale debt baseline unchanged at 306.
- Route-review bundle builds.
- `profile-default` at 1440: **0 pixel difference** before/after the CSS deletion.
- `profile-custom` at 1440: 71 changed pixels at the top-left wordmark only; the
  cards and tinted surfaces are unchanged.
- Source diff: 14 files, +57/−126 lines.

This makes the user/family profile card paths the same implementation, not just
the same pixels. The next slices continue with the same rule: replace the old
primitive, delete the old CSS/component, then prove the render.

## Completed: import boundary and simple surface/control sweep

- 96 files moved direct MUI typography, fields, selects, tabs, menus and form
  controls onto the `components/ui` exports. Checked routes were pixel-identical.
  Scale debt fell 306 → 158; architecture baseline reduced.
- 13 direct MUI `Paper`/`Card` surfaces became `UiCard`; 143 `Button`/`IconButton`
  instances became `UiAction` with named `size="small"`/`block` variants. Added
  the `UiAction` size/block variants and CSS rather than page overrides.
- Fixed the mobile menu trigger (`iconOnly`) after the first button sweep changed
  the header geometry.
- Build and `lint:ui` pass. Remaining direct surfaces/controls are those with
  complex `sx`, icons, dynamic variants, or dialog APIs.

## Completed: dialog frame and first dialog set

- `UiDialog` gained a named `size` variant; new dialogs no longer pass one-off
  `maxWidth` literals (the architecture guard rejects those).
- Migrated to `UiDialog`: `AppealDialog`, `CookieBanner`, `LeaveGameDialog`,
  `FanartPanel` post dialog, the shared `Modal` wrapper, and
  `PendingTradeConfirmations`'s `RespondDialog`.
- The Family invite Accept/Reject buttons and the four Settings family actions
  now use `UiAction` (the four were skipped by the subagent because of a 240px
  literal; the literal is gone).
- Mobile menu trigger fixed to `iconOnly`; header geometry restored.
- `node scripts/check-ui-architecture.cjs` passes.

## Completed: Fame/Report surfaces and comment typography

- Hall of Fame, Competitive, Report Detail and Poll surfaces migrated to
  `UiCard`; competitive card heights and report section margins are named classes.
- Stock Market IPO fee summaries use `UiCard` with a theme-safe 2% tint class;
  the three table scroll wrappers remain Paper/TableContainer because they are
  scroll surfaces, not cards.
- Comment body typography already matched the forum (16px/24px/400). Aligned the
  header: forum author names are 16/600 and forum metadata is 12px/18px, the same
  scale as comment names and times. The forum keeps its extra metadata.

## Completed: dialogs and page-level actions

- 24 direct dialogs migrated to `UiDialog` across page and component files.
  `UiDialog` gained `size` and `overflowVisible` variants; Shop uses the latter
  for stamp suggestions. Dialog titles now use the shared 20px/700 heading scale.
- Announcement test selectors updated for the shared dialog DOM; the footer
  "Close" is scoped to `.ui-dialog-actions` because the title also has a close
  icon.
- Guest auth Login/Register and profile header actions (friend, invite, block,
  poke) use `UiAction`.
- Profile trade/share and detailed-stats actions migrated.
- `lint:ui`, production build and 29 UI/socket tests pass. Scale debt **137**.
- Remaining direct MUI counts: ~32 Button, 20 IconButton, 21 Paper, 9 Dialog
  family, plus native controls/game workspace.

## Completed: dialog frame measurement and page surfaces

- The dialog audit exposed the real cause of the spacing/alignment problem:
  MUI's theme `MuiDialogTitle` override (`8px 20px`, weight 600) was winning over
  `ui.css`, so the title and content had different left edges and vertical rhythm.
- Canonical frame now lives in `constants/themes.jsx`: title `16px 24px 8px`,
  20px/700; content `8px 24px 16px`, body 16px; actions `16px 24px`, wrapping,
  centered, 40px actions. `ui.css` mirrors the same values.
- Forum Search's Search action is now `UiAction` (was MUI Button, 44px vs 40px);
  ReportDialog description is 16px; Host/Trade dialogs use named `size`; the
  23px setup-name trigger is a 44px touch target; trade subject name is 16px.
- Focused dialog audit is down to 6 findings: two Search helper-text 12px rows,
  two Create Thread content-button-height rows (switch/toggles, not the action
  row), and two popover title-size rows. No dialog frame/action finding remains.
- Page surfaces migrated: Welcome auth card, Banned notice/appeal cards, forum
  Search Results summary/results. Search Results had a missing `UiIcon` import
  after the action migration; fixed and the route no longer throws.

## Completed: shared controls, overlays and touch targets

- Dialogs: helper text is no longer read as dialog body copy, action-height
  comparison is limited to the action region, and the focused audit is at
  **0 findings**. The overflow-visible content variant now actually beats
  MUI's scrolling content rule.
- Forms and editors: Create Thread, petition, roster, mention search, deck
  names/cards/word lists and the shared markdown editor use `UiField`,
  `UiAction`, `UiSwitch`/`UiCheckbox` and the shared editor surface. The
  editor toolbar has 32px targets and themed tabs; the old raw `.form`,
  `.field-wrapper` and `.switch` paths are gone, and react-mde now uses the
  shared themed chrome.
- Votes and actions: `VoteWidget` uses one 32px desktop / 44px touch target
  for up/count/down. Friend, report, DM, strategy, tutorial, poll, competitive
  and stock actions use `UiAction`; a semantic `success` variant covers stock
  buys and moderation approvals.
- Surfaces: shop cards, report rows, profile tier/rank and other page
  surfaces use the shared card/row treatments. The phone navigation keeps its
  dedicated nav shell; it is navigation, not a card. The dead Ranked
  Stats modal and its CSS were removed.
- Shop: the Scrapbook Stamp suggestion list is inline and keyboard-accessible
  (40/44px rows), so it no longer sits behind the dialog actions.
- Profile: banner editing no longer depends on hover. Touch devices get a
  compact 44px edit/remove control at the banner's top-right; crop zoom
  controls are square 32/44px actions.
- Icon-only actions now resolve to 32x32 on desktop and 44x44 on touch; the
  dialog close control was previously 32x40.

## Final redesign-only matrix (2026-11-15)

- Full matrix on `43a604003`: **924/924 redesign cells captured**,
  **0 open findings**, 2,040 intentional rows. Widths 1440/390/320, dark and
  light, controlled production fixtures.
- Late defects found and fixed by the audit:
  - Role pages crashed with `ReferenceError: UiDialog is not defined`;
    `FanartPanel` now imports the shared dialog.
  - Profile karma controls sat 29px from the score; they are adjacent again.
  - The role fanart section reserved a reading-width column and left a 360px
    gap; it now fills the role content edge.
  - Nested role/competitive headings mixed page and nested scales; they use
    the body scale, and the phone stock tabs are a named compact variant.
- Audit tasks were repaired for the current DOM: word editor textarea, role
  hero, karma score, settings delete confirmation and the shared ban-appeals
  table. All 924 cells now capture.
- The matrix records `visualAcceptance: false`; it is structural evidence, not
  a substitute for reviewing the screenshots.

## Verification

- `lint:ui` passes; unit tests pass (29).
- Focused dialog audit: **0 findings** (forums, profile, family, setup, shop).
- Control/heading audit: **0 findings** across 10 routes and 18 renders. Two
  role-detail captures failed only because the fixture copy no longer matches.
- Scoped comparative geometry audit (shop, stocks, profile-rich, forum-thread):
  **0 open findings**; 36 intentional intrinsic-width findings. The trade
  dialog's Buy/Sell choice is now the shared segmented control, and dialog
  actions are compared within their own 40px frame.
- Browser suites: mobile header **25/25** at 320/360/375/390; DM panel **9/9**;
  Banned **19/19**; Mod commands **8/8**; Ban appeals **36/36** after pointing
  the suite at the shared table rows.
- Dark and light screenshots were inspected for profile, family, shop, stock
  market, competitive, lobby, forum thread, setup editor, auth and activity.
- Scale debt is **96**; the architecture baseline has been reduced after each
  slice.

## Not verified / open

- Authenticated WebSocket behavior end-to-end is still unverified; only raw
  prod handshakes were checked.
- The strategy-windows browser suite passes desktop. Its mobile half fails on
  a pre-existing fixture layout/crash (the fixture's game object lacks the
  current setup/player shape); this is not a control regression.
- The full final comparative matrix has not been rerun; do not call the site
  visually accepted until it is.

## Next queue

1. Repair or explicitly retire the stale strategy-mobile and forum-reply
   browser fixtures.
2. Build the master fixture contract and run the paired comparative matrix;
   do not substitute redesign-only results for master evidence.
3. Review the remaining intentional exceptions: branded auth buttons, MUI
   progress/menus, game workspace controls, media/upload overlays, the Auth
   dialog, the full-screen strategy reader, the stock table rendering path and
   the draggable DM/strategy windows.
4. Keep reducing the baseline only when a migration removes the old path.

## Local login proxy

- The client `.env` uses the `beyondmaf` Firebase project; the local backend
  expects `ultimafia-dd36b`. The branch's `rsbuild.config.ts` had lost the
  remote-backend proxy, so login reached the wrong backend and returned 403.
- Restored the remote-backend proxy in `react_main/rsbuild.config.ts` while
  keeping the branch's same-origin socket changes. The dev server now logs that
  API/uploads/sockets are proxied to the configured remote backend.
- The proxy is committed with the shared-surfaces batch because the redesign
  branch must be testable against production. Keep it in the branch.

## Branch hygiene

- Master tracked changes are in `stash@{0}`:
  “master unrelated changes before redesign switch”.
- Master untracked work is preserved in
  `~/Documents/Ultimafia-master-unrelated-untracked`.
- The master `docs/frontend-redesign` tree is preserved in
  `~/Documents/Ultimafia-master-redesign-docs`.
- Do not commit the unrelated master files on the redesign branch.
