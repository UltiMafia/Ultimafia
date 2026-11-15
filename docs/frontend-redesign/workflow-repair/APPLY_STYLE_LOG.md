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

## In flight

- None. Next slice: remaining direct surfaces/buttons and popover title scale,
  then the audit clusters.

## Next queue

1. Remaining `Paper`/`Card` with complex `sx` (StockMarket summary, Family
   trophy spotlight handled, ReportDetail, etc.).
2. Remaining `Button`/`IconButton` with icons/sx.
3. Remaining `Dialog*` outside the shared `UiDialog` (BannerUpload,
   DeathSoundUpload, StampTradeModal, etc.).
4. Comments: one component for `.post` and `.comment-row`.
2. Comments: one component for `.post` and `.comment-row`, with the forum's extra
   metadata as a named variant.
3. Setup/role detail: verify the shared section/vote skeleton is complete and
   delete the remaining page-specific section classes.
4. Re-measure the open audit clusters on the current branch: secondaryAction,
   sectionContainer, sectionHeading, textInput/select.
5. Lower the architecture baseline after each migration; never raise it.

## Local login proxy (do not commit)

- The client `.env` uses the `beyondmaf` Firebase project; the local backend
  expects `ultimafia-dd36b`. The branch's `rsbuild.config.ts` had lost the
  remote-backend proxy, so login reached the wrong backend and returned 403.
- Restored the remote-backend proxy in `react_main/rsbuild.config.ts` while
  keeping the branch's same-origin socket changes. The dev server now logs that
  API/uploads/sockets are proxied to the configured remote backend.
- This file is a local environment change, not part of the redesign PR. Exclude
  it from commits.

## Branch hygiene

- Master tracked changes are in `stash@{0}`:
  “master unrelated changes before redesign switch”.
- Master untracked work is preserved in
  `~/Documents/Ultimafia-master-unrelated-untracked`.
- The master `docs/frontend-redesign` tree is preserved in
  `~/Documents/Ultimafia-master-redesign-docs`.
- Do not commit the unrelated master files on the redesign branch.
