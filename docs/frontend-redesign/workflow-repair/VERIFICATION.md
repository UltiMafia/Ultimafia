# Workflow repair: forums, profiles, moderation, navigation and shared surfaces

## Scope

This batch follows the user's direct visual reports on the redesigned site. It
does not replace the populated local site or claim subjective acceptance.

- **Profiles:** the profile page is now a continuous dashboard instead of five
  hidden tabs. The identity header is followed by the karma strip, a section nav
  (About, Statistics, Games, Setups, Comments, Connections, Collection), and a
  two-column dashboard. About, statistics, recent games, setups and comments are
  in the main column; connections, stock, media and archived games are in the
  side rail; the collection is a full-width section below. The **pie chart is
  restored** on the profile statistics section and in the player popover.
  Comments use a compact header/content/vote-footer card instead of a left vote
  gutter. The profile karma controls stay beside the score, including on your own
  profile, and profile comments/games use structured rows.
- **Forums:** the forum thread page uses bordered post sections with the author,
  timestamp, vote control, reply action and permalink in stable positions. Board
  pages use a continuous thread directory with explicit **Thread** and **Latest
  activity** columns on desktop, stacking the same information on phones. Real
  local forum data was seeded for review.
- **Moderation:** the single crowded log page is split into **Recent actions**,
  **Run action** and **Staff groups**. Each page has one job, its own heading and
  the shared moderation side navigation. Action arguments are labeled fields
  rather than an inline sentence.
- **Families and shared surfaces:** family panels and homepage right-column
  panels now use the same `.ui-card` surface (16px padding, 1px border, 6px
  radius, scheme background, no shadow). Family settings no longer renders a
  stray `0` when the account does not own the create-family item.
- **Site navigation:** the sidebar exposes **Play** (Host a game, Create setup,
  Competitive, Stock market) before **More**. Character and word decks live in
  More, below Competitive and Stock market. Utility links share the same 24px
  icon slot and spacing, including the iOS beta link.
- **Game and lobby:** the desktop game top bar centers the day/state switcher,
  keeps the setup summary and Leave game in a right-hand group and no longer
  offers a Browse site link that navigates out of the game. The lobby has only
  **Games** and **More**; the Chat and empty Setups tabs are gone.
- **Setups and hosting:** the host dialog groups fields into **Game and lobby**,
  **Access and options** and **Timing** cards. Setup detail uses card sections for
  roles, description, discussion and secondary panels. Setup creation puts the
  role picker before the selected-roles summary on phones and offers an explicit
  Review roles action.
- **Controls and popovers:** labeled native selects shrink their labels on Host,
  Feedback, Family discovery, Setup version, Create Setup and Reports. Setup and
  game detail popovers have a visible info icon as the click target, readable
  titles and bounded height. Mission settings appear only when the setup actually
  contains a Spymaster role.
- **Word decks:** missing or failed covers use a neutral document placeholder in
  the same 96x64 slot as a real cover, so titles and actions stay aligned without
  empty framed boxes.

## Verification

| Check | Observed result |
| --- | --- |
| Full route inventory | 192 cases per palette: 64 routes × 3 widths (1440, 390, 320), dark and light; 0 failed captures, no runtime errors, no unresolved fixtures |
| Frontend Node tests | 225 passed, 0 failed |
| Retained-app lifecycle | 33 checks passed; no failures or errors |
| Competitive workspace | 16 cases passed; no errors |
| Shared controls | 57 interaction checks passed; 39 states captured |
| Game layout matrix | 36 cases passed (dark/light × pregame/live/review × 1440/1180/1024/390/320/740) |
| Ban appeals focused suite | 36 checks passed, including queue links, case data, required justification and vote change |
| Homepage restoration | 10 cases passed; community wall, right-column features and lobby structure retained |
| Production build | Passed |
| UI architecture check | Passed; no new direct controls, browser dialogs or alternate icon/loading imports outside `components/ui` |
| Scoped ESLint | 0 errors; warnings remain |
| Local forum data | Live API returns 2 categories, 5 boards, 7 threads and 23 replies; seeded records use `mock-*` IDs and are rerunnable with `scripts/seedForumMock.js` |
| Phone URL | `https://mm-acer-desktop.tail162da2.ts.net:8443/play` returned HTTP 200 over Tailscale; the 390px forum board rendered its 2 Mafia discussion threads |

The profile route task now verifies all seven section destinations exist and are
visible without a tab click, then retains a comment draft while scrolling between
sections. Route interactions also include profile karma upvote/undo (including
the self profile), report open/back, GitHub approval/rejection cancellation,
group-member removal cancellation, competitive setup add/cancel, moderation read
retry, feedback draft retention after a forced in-memory failure, family
role/removal/bio cancellation, setup creator add/copy/remove and save payloads,
and role/setup navigation. The moderation split adds separate Recent actions,
Run action and Staff groups cases.

### Evidence

- `final5-routes-dark/` and `final5-routes-light/` contain the final full route
  runs, 192 cases each, including the continuous profile dashboard and compact
  comment cards.
- `final5-controls/` contains the final shared-control captures.
- `final5-homepage-restoration/` contains the homepage restoration captures.
- `final5-live/` contains the live-site captures that route fixtures cannot
  provide: the lobby sidebar and tabs, the setup popover, the player popover pie
  chart, the moderation Recent actions page, word decks, the 390px Tailscale
  forum and lobby pages, and the community-wall comment cards at 390px and 1080px.
- `final4-game/`, `final4-competitive/`, `final4-ban-appeals/` and the saved
  lifecycle log cover the game, competitive, ban-appeal and app-lifecycle suites,
  which were not changed by the profile/comment layout work.
- `profile-redesign-dark/` and `profile-redesign-light/` retain the focused
  profile captures used while reworking the dashboard.
- `final4-routes-*`, `final3-*`, `final2-*`, `structure*`, `card-check/` and
  earlier folders remain diagnostic history; failed or superseded runs are not
  counted as final.

Screenshots are controlled production-component fixtures unless they are named
as live-site captures. They are not a claim of authenticated live gameplay or
physical-device testing.

## Genuine limits

- Provider sign-in still needs `mm-acer-desktop.tail162da2.ts.net` added to
  Firebase Authentication Authorized domains. No account was signed into.
- Authenticated hosting, trades, purchases, family administration and destructive
  moderation were not performed. Fixture writes are in-memory only.
- Chromium viewports are not a physical-phone keyboard, browser-chrome or
  safe-area test. Full minigame/network behavior and every entitlement branch are
  not verified.
- Tests and visual inspection are evidence, not exhaustive subjective acceptance.

All changes remain unstaged, uncommitted, unpushed and undeployed to an UltiMafia
server. The populated local site continues to serve the working tree.
