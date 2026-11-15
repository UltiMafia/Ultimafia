# Control rules

**Rule zero: never make an unprecedented UI choice.** If the control or treatment
you need is not in `react_main/src/components/ui/` and not covered below, use the
nearest established pattern or stop and ask. A new pattern means: extend the
primitive, add its rule here, add its enforcement test — in one change, not one
page.

Every rule below is written to be checkable. The enforcement column names the
mechanism; a rule without one is not yet a rule.

## Actions (`UiAction`)

An action has two independent properties. Use the semantic props, not the legacy
`variant` alias.

| Property | Values | Meaning |
|---|---|---|
| `tone` | `neutral` (default), `brand`, `positive`, `destructive` | what the action means |
| `emphasis` | `default`, `primary` (default for `brand`), `quiet` | how loud it is |
| `raised` | boolean, default `true` only for `emphasis="primary"` | 3px hard bottom edge, 2px press travel |

Raised and filled are different things. A brand-filled action is raised; a
positive or destructive filled action is flat; a raised neutral is not used.

| Emphasis | Allowed use |
|---|---|
| `primary` | The single most important action on the surface. **At most one per surface.** Raised. |
| `default` | Every other action that needs a boundary. Filled neutral with a 1px border, flat. |
| `quiet` | Inline, row-level or tertiary actions. Transparent. Icons and pagination use this. |

Tone rules:

- `brand` — starting or joining the primary activity (Host, Join, Save, Submit).
- `positive` — confirming a beneficial commitment (Buy, approve). Flat.
- `destructive` — an irreversible or destructive act (delete, ban, revoke).
  **Selling stock, leaving a page or cancelling is not destructive.**
- `neutral` — everything else, including reversible monetary actions. Express
  buy/sell direction with the price/value colour, not with button colour.

Legacy `variant` values map to these axes and are deprecated:
`primary`→brand/primary, `secondary`→neutral/default, `ghost`→neutral/quiet,
`success`→positive/default, `danger`→destructive/default,
`danger-quiet`→destructive/quiet. The count of legacy usages may only shrink
(`action:legacy-variant` in the architecture baseline).

Enforced now: `UiAction` throws on an unknown tone/emphasis/legacy variant, and
`scripts/check-ui-architecture.cjs` counts legacy usage against a baseline that
may only shrink. Not yet enforced: "at most one primary per surface" needs a
rendered-page assertion; the elements already carry `data-tone`/`data-emphasis`
so the audit can count them per surface.

## Chips (`UiChip`)

One component, three variants. No page-local pills, badges or filter chips.

| Variant | Use | Behaviour |
|---|---|---|
| `status` | Read-only facts: `Open`, `Ranked`, `Finished`, a role's alignment | Not pressable; optional tone |
| `filter` | A toggle that narrows a list | `aria-pressed`; `emphasis="primary"` when pressed |
| `tag` | A removable value | Requires `onRemove` with an accessible label |

Chips are 8px radius like every control. No uppercase, no letter-spacing
theatrics, no 999px pills. A status that changes the query is a `filter`, not a
`status`.

Enforced now: `UiChip` throws on an unknown variant; the architecture guard fails
a page-local chip/pill component. Not yet enforced: uppercase in arbitrary CSS
(37 declarations remain outside `components/ui`).

## Tabs (`UiTabs`)

- Left-aligned on every page. `centered` is not supported and throws.
- A tab strip is navigation, not a filter: filters are `UiChip variant="filter"`.
- One strip per section. A second strip inside a tab panel is a filter row, so it
  uses segmented control or chips.

Enforced now: `UiTabs` throws when `centered` is passed, and the guard rejects
`centered` in source; the three call sites that used it were removed.

## Pagination (`UiPagination`)

- One pagination widget per list, **below** it. No top copy, no duplicate for
  "convenience".
- Wraps MUI `Pagination`; arrow keys and the current-page announcement come from
  MUI.
- Data tables also show a page-size control in the same footer row.
- A list that fits on one page renders no pagination.

Enforced now: `PageNav` delegates to `UiPagination`, so there is one
implementation; the guard counts `inverted` against a baseline that may only
shrink. The duplicate top copy was removed from Profile and Comments. Not yet
enforced: "at most one per list region" as a rendered assertion.

## Page width (`UiPage`)

| Width | Use |
|---|---|
| `wide` | Lobby-adjacent lists, boards, tables, profiles, families, settings, moderation, notifications, tutorial |
| `reading` | Short-form policy pages that read as a single column |
| `prose` | Rules, terms and privacy text |
| `full` | The lobby only, where the desktop right column needs the width |

The choice follows the page family, not author preference.

Enforced now: `UiPage` throws on an unknown width and the guard rejects raw
width overrides. Not yet enforced: the family-to-width assignment itself.

## Shape

Radius tokens are `0` (flush), `6` (card), `8` (control), `12` (dialog). There is
no pill radius. A control's container and its children use the same radius.

Enforced now: the pill token is removed and the guard rejects `border-radius:
999px` or `--ui-radius-pill` outside `components/ui/ui.css`.

## Scrollbars

One global style, in `css/main.css`, defined for both engines: `::-webkit-scrollbar*`
and `scrollbar-width`/`scrollbar-color`. No per-surface scrollbar styling outside
`components/ui`.

Enforced now: the guard rejects a `::-webkit-scrollbar` block that is not paired
with `scrollbar-width`/`scrollbar-color`. The four legacy files were fixed.

## Enforcement status at a glance

Working now: closed variant sets that throw, the architecture baseline (may only
shrink), the pill/scrollbar/tab rules, and one pagination and chip implementation.

Still needed before the remaining rules are real: a rendered-page assertion pass in
the existing route audit — one primary per surface, one pagination per list with
its position, page width by family, and chip uppercase — plus the test-suite
migrations below.

## Known migration debt (may only shrink)

- Legacy `variant` call sites on `UiAction`: 324 counted usages across 105 files
  (the baseline in `test/ui-architecture-baseline.json`, which may only shrink).
- Tables: `StockMarket.jsx` builds a MUI table with inline `sx`; Hall of Fame
  renders a CSS grid with `TableSortLabel` and no table element. Both migrate to
  `UiTable`; the split is `records` vs `comparison`, not a third style.
- `text-transform: uppercase` outside `components/ui`.
- The 115-file architecture baseline and 96-site scale debt.
