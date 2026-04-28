# Compact Competitive Round History Cards

## Problem

In the Competitive page's "Round History" tab, each game card renders the player list one player per line with a 40px avatar and `body2`-sized name. With a typical 7-14 players per game, the right column dominates the card height — easily 340-670px per game. Days with multiple games make the page scroll feel endless.

## Goals

- Cut typical card height by ~60% by replacing the single-column player list with a winners/losers split.
- Preserve visual identity (cards still feel like cards; avatars and badges still legible).
- Add semantic structure — at a glance, you can see who got points and who didn't.
- Mobile-friendly without losing the semantic split.

## Design

### Layout

Change the right side of each game card from a single vertical list of players into two side-by-side columns:

- **Left sub-column:** players with `points > 0` (winners), sorted by points descending; ties resolved by stable input order.
- **Right sub-column:** players with `points === 0` (losers), in stable input order from the API.

Outer card layout stays as today: game info on the far left, player block on the right. The player block is the part being subdivided.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Game BRrSzHhZ-                                                          │
│  ┌──────────────────┐   👤 _queenbee_ 43🟢   👤 TheJoker    0🟢          │
│  │ 🏠 [3d] [REVIEW] │   👤 VXN        43🟢   👤 a           0🟢          │
│  │ Expert Guns n H. │                         👤 NoobyBoi    0🟢          │
│  │ 👤👤👤👤👤          │                         👤 Starry      0🟢          │
│  └──────────────────┘                         👤 Aspect8445   0🟢          │
└─────────────────────────────────────────────────────────────────────────┘
```

No column headers. Position + visible point values make the split self-evident.

### Per-row spec

| Element | Today | Proposed |
|---|---|---|
| Avatar size | ~40px | 24px |
| Name typography | `body2` (~0.875rem) | `caption` (~0.75rem) |
| Row height | ~48px | ~28px |
| Badges (groups) next to name | shown | shown (still rendered via `NameWithAvatar`; will visually shrink with the smaller text) |
| Points + icon | right-aligned in row | right-aligned within the sub-column |

### Mobile behavior

The current page collapses to 1 column on phones (game card on top, player list below). Keep the winners/losers split on mobile too — collapsing it back to a single list defeats the purpose. So on mobile:

- Top: game info
- Below: 2-column winners/losers split (still side by side, just narrower)

If avatars + caption-size names risk wrapping or overflowing on very narrow screens, allow the name to truncate with ellipsis rather than wrap.

### In-progress games

In-progress games are already excluded from the Round History view upstream (the `gameCompletions` array only contains finished games). No special handling required in this redesign.

### Edge cases

- **All winners** (no zero-point players) → losers column is empty, winners column fills.
- **All losers** (no points awarded, e.g., aborted-but-finished game) → winners column empty.
- **Single player on either side** → render that single row in the appropriate column.
- **Even card height across columns:** card height is `max(winners-rows, losers-rows) * row-height`. With 3W/7L this is driven by losers (typical case).

## Card height math

| Scenario | Today | Proposed | Delta |
|---|---|---|---|
| 3 winners + 7 losers | 7 × 48 = 336px | max(3,7) × 28 = 196px | -42% |
| 2 winners + 5 losers | 7 × 48 = 336px | 5 × 28 = 140px | -58% |
| 7 winners + 7 losers | 14 × 48 = 672px | 7 × 28 = 196px | -71% |

## Files touched

- `react_main/src/pages/Fame/Competitive.jsx` — `GameHistory` component (~lines 312-450). The right Grid2 cell that maps `pointsEarnedByPlayers` becomes a 2-column split, with the per-row JSX shrunk to use a smaller avatar and caption typography.

## Out of scope

- The `GameRow` game-info card on the left — stays as-is.
- The `Day N` header — stays as-is.
- The API and data shape — unchanged.
- The other tabs on the Competitive page (Standings, Setups, etc.) — untouched.
- `NameWithAvatar` itself — used as-is (we control sizing through the props it already accepts).

## Verification

The user is reviewing the diff visually rather than running the code. The implementation plan should keep the change small enough to be readable end-to-end (one component, one render path), with no new abstractions or helpers unless they meaningfully simplify the JSX.
