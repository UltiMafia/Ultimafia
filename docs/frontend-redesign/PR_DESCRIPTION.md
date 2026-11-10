# UltiMafia client redesign

## Status: draft, not ready to merge

This PR is the **complete client redesign**, not a cleanup pass on top of master. It replaces the client shell, navigation, lobby, forums, profiles, families, moderation, setup/host flows, decks, shop, stock market and game chrome. Compare the diff against master for the full scope.

This is a draft because the redesign is not finished and several pages still have obvious layout defects. It is not a claim of visual acceptance. The mechanical full-site audit described at the end has not been built yet.

## Compared to master

| Measure | master → this branch |
| --- | --- |
| Files changed | 317 |
| Additions / deletions | +19,497 / −14,104 |
| New files | 133 |
| Deleted files | 33 |
| Modified files | 151 |

The major structural changes against master:

- **Shell:** `SiteLayout` and `SiteNavigation` replace the old `CustomAppBar`/`Menu`/mobile header arrangement; the sidebar is regrouped and the phone navigation is rebuilt.
- **Lobby and community:** the lobby is rebuilt around Games/More, the community wall, game discovery and the right-column features; forums, comments and profile pages are reworked.
- **Profiles:** the master two-column profile layout is intentionally restored, with the pie chart kept and comments using the shared card treatment.
- **Families, moderation, setups and hosting:** new page layouts, split moderation pages, shared setup/host cards and full-role setup editor data.
- **Decks, shop and stock market:** shared deck library, product cards and coin icon; the stock table and summary are reworked.
- **Design system:** new `components/ui` primitives, icon sets and licenses, shared CSS tokens and a UI-architecture check.
- **Removed:** 33 files, including unreachable legacy components and the old raster coin image.

## What this changes

### App shell and navigation
- New `SiteLayout` / `SiteNavigation` shell with a stable desktop sidebar and phone bottom navigation.
- Sidebar reorganized into Games, Community, Players, Learn, Rankings, then **Play** (Host, Create setup, Competitive, Stock market) and **More** (Families, Feedback, Activity, Metrics, Contributors, Donors, Character decks, Word decks, Moderation).
- Shared 24px icon slots and consistent spacing; iOS beta link uses the same icon slot.
- Mobile header, bottom navigation, account menu, notifications, DMs and footer aligned to the shared layout.

### Lobby, forums and community
- Lobby has **Games** and **More** only; the old Chat and empty Setups tabs are gone.
- Lobby game cards show setup, lobby, status, ranked/competitive cues and a visible **Details** trigger on the player-count control.
- Forum board pages use a continuous directory with **Thread** and **Latest activity** columns on desktop, stacked on phones.
- Forum posts use bordered sections with author/time metadata inline, reply controls and permalinks.
- Comments use a compact card: 32px avatar, author/time header, content, vote/reaction footer. The old full-height left vote gutter is gone.
- Seeded local forum data for review: 2 categories, 5 boards, 7 threads and 23 replies; rerunnable with `scripts/seedForumMock.js` and limited to `mock-*` records.

### Profiles
- Profile layout restored to the **pre-redesign master layout** (two-column profile grid, centered identity header, left bio/comments, right stats/ratings), as requested.
- The **pie chart is restored** in the profile statistics panel and in the player popover.
- The profile page no longer uses the redesign's tabbed dashboard.
- Self-profile karma controls are available; the server already permits self-voting.
- Comments use the shared compact comment card.

### Families
- Family page uses a two-column layout with a consistent 16px card gap: bio and comments in the main column; members, stock, applications, treasury, join fee, perks and ledger in the rail.
- Family cards and homepage cards share the `.ui-card` surface (16px padding, 1px border, 6px radius, scheme background, no shadow).
- Family settings no longer renders a stray `0` when the account does not own the create-family item.

### Moderation
- Moderation split into focused pages: **Recent actions**, **Run action**, **Staff groups**, plus handbook, reports, competitive, flagged intake, GitHub links, volunteer and ban appeals.
- Action arguments are labeled fields rather than one inline sentence.
- Staff handbook uses the wide moderation shell with a prose-width reading column.

### Setups and hosting
- Setup detail uses shared `ui-card` sections for roles, description and discussion.
- Roles card uses a multi-column, height-bounded grid so 100+ roles do not turn the page into an 8,000px column.
- Setup statistics use a neutral `UiStatRow`; the old colored stat cards and multicolored filter buttons are gone. Win-rate bars use one accent color.
- Setup editor uses the full 443-role Mafia list. The role list is height-bounded, the selected-roles panel is sticky on desktop, and **Add role set** lives in the panel header (and in the phone summary bar) instead of at the bottom of a page-height grid.
- Setup editor phone header stacks the title and game-type select; role tabs show scroll arrows.
- Host dialog groups fields into Game and lobby, Access and options and Timing cards; empty groups are no longer rendered.
- Native select labels shrink on Host, Feedback, Family discovery, Setup version, Create Setup and Reports.

### Decks, shop, stock market and controls
- Word decks use a neutral document placeholder in the same 96×64 slot as a real cover.
- Currency icons unified to the pixel coin-stack `CoinIcon`; the old raster `umcoin.png`, `lucide:coins`, `fas fa-coins` and `UiIcon name="coins"` variants were replaced.
- Shop product cards use the shared `.ui-card` surface.
- Stock market summary is a neutral card; table headers are plain labels with sort arrows, the clipped action column was removed, and the trend column was dropped from the table so Buy/Sell fit.
- Stock market tabs and controls use the pixel icon family.

### Design system and dead code
- Added shared primitives: `UiCard`, `UiStatRow`, `UiStat`, `CoinIcon`.
- Reused `UiSection`, `UiAction`, `UiIcon`, `UiField`, `UiDialog` across the changed surfaces.
- Deleted 33 files (legacy minigames, announcement/chart components, unused service worker, old CSS and the old raster coin image) — about 3,100 lines.
- Added `test/routeReviewRoles.json` with the real 443-role Mafia list for realistic role-picker and setup-detail review.

## Screenshots

The **master baseline** images were captured from `origin/master` at the commit described as “fix(game): animate the Settings menu again and keep it inside the panel”, served from a local static build against the same local database. The **redesign** images are from this branch at the same 1440×1000 viewport and the same data. The remaining screenshots are from this branch's controlled production-component fixtures or the populated local site. None of this is a claim of authenticated live gameplay.

### Master baseline vs redesign: Players directory

![Players before](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/players-master.png)

![Players after](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/players-redesign.png)

Both captures show the same local data: 1 user online, the same online player and the same Newest Users list. The difference is the client, not the content.

### Master baseline vs redesign: Lobby

![Lobby before](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/lobby-master.png)

![Lobby after](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/lobby.png)

Both captures show the same 7 games from the same local database. Master uses the old horizontal navigation, iOS ticker and All/Main/Sandbox/Competitive tabs; this branch uses the sidebar shell and the Games/More lobby.

### Profile: master layout restored, pie chart retained
![Profile layout](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/profile-master-layout.png)

### Setup editor with the full 443-role list
![Setup editor](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/setup-editor-full-roles.png)

### Setup detail with 120 roles
![Setup detail](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/setup-detail-many-roles.png)

### Setup statistics: neutral stat row and single-accent bars
![Setup statistics](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/setup-statistics.png)

### Family page layout
![Family page](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/family-page.png)

### Forum thread with inline author metadata
![Forum thread](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/forum-thread.png)

### Compact comment card on a phone
![Comment card](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/comment-card-phone.png)

### Stock market: neutral summary, plain sort headers, visible actions
![Stock market](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/stock-market.png)

### Shop with the unified coin icon
![Shop](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/shop-full.png)

### Host dialog
![Host dialog](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/host-dialog.png)

### Staff handbook: wide shell, prose-width text
![Staff handbook](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/staff-handbook.png)

### Game workspace
![Game workspace](https://raw.githubusercontent.com/BlueCannonBall/Ultimafia/redesign/workflow-repair-draft/docs/frontend-redesign/pr-evidence/game-workspace.png)

## Verification

| Check | Result |
| --- | --- |
| Full route inventory | 192 cases per palette (64 routes × 3 widths), dark and light; 0 failed |
| Frontend Node tests | 225 passed, 0 failed |
| Shared controls | 57 interaction checks, 39 states |
| Game layout / competitive | 36 / 16 cases passed |
| Lifecycle / ban appeals | 33 / 36 checks passed |
| Homepage restoration | 10 cases passed |
| Production build / UI architecture | Passed |
| Scoped ESLint | 0 errors; warnings remain |

Evidence: `docs/frontend-redesign/workflow-repair/final8-routes-dark/`, `final8-routes-light/`, `final7-controls/`, `final7-homepage-restoration/`, `profile-current-rerun/`, and the focused `final4-game/`, `final4-competitive/`, `final4-ban-appeals/` runs.

> Note: the 192-case full route run was captured before the final profile, stock-market and coin-icon edits. The profile and stock cases were rerun after those edits, but a final full run is still part of the proposed audit.

## Known issues / why this is a draft

- **Settings birthday input is about twice the width of every other settings input.** It is not using the same field width primitive. This is identified but not fixed.
- The **forum reply editor is still raw and ugly**: the editor surface, toolbar, helper text, image note and Post/Cancel row do not share the site's card/composer treatment.
- **Profile recent-game rows still need a richer information pass** (role summary, player count, ranked/competitive tags, duration/end time). The current rows are compact but still thin.
- The **full-site audit harness described below has not been built**. The route captures are broad but are not yet a mechanical check for width outliers, one-character wrapping, clipping, surface drift and icon-family drift across every dialog and state.
- Coin/icon consistency is improved but not exhaustively audited; some icon contexts may still use a different family or size.
- The setup editor/detail with very large role lists needs a second visual review at 320px and in light mode.
- Visual acceptance is not claimed. There are pre-existing UltiMafia layout defects outside the redesign scope.
- Provider sign-in still needs the Tailnet hostname added to Firebase Authorized domains. No authenticated live hosting, trading, purchase, family-administration or destructive-moderation journey was performed.
- Physical-phone keyboard/safe-area behavior and full minigame/network coverage are not verified.

## Proposed next step: mechanical full-site audit

The reason “check everything” has not worked is that it is a demand, not a coverage mechanism. The next step is:

1. Enumerate every route, tab, dialog, popover and state in `docs/frontend-redesign/workflow-repair/UI_INVENTORY.md`.
2. Capture the full matrix at 1440/390/320, dark/light, with the full role list and populated local data.
3. Run DOM/style checks for input-width outliers, clipping, horizontal overflow, one-character wrapping, inconsistent surfaces, mixed icon families/sizes, empty groups, contrast and overlap.
4. Fix the findings and add lint/CI guards so new one-off controls, cards, icons and field widths cannot be introduced.
5. Bring back only the genuine product-judgment questions.

That is the only realistic way to cover the mountain of pre-existing defects without requiring a screenshot of every one.

## How to review

- Read `docs/frontend-redesign/workflow-repair/VERIFICATION.md` for the full evidence record and limits.
- Read `docs/frontend-redesign/workflow-repair/UI_INVENTORY.md` for the surface list.
- Run `cd react_main && npm test`, `npm run lint:ui`, and `npm run build`.
- The route harness is `node test/run-route-review.cjs` with `ROUTE_OUTPUT_DIR`, `ROUTE_WIDTHS`, `ROUTE_THEME` and `ROUTE_CASES`.

Please treat this as a starting point for review, not a finished redesign.
