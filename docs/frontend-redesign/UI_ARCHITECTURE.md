# Client UI architecture

## Supported composition

Use `react_main/src/components/ui` for presentation primitives. A page composes
`UiPage`, `UiSection`, `UiCard`, `UiField`, `UiAction`, `UiIcon` and `UiDialog`;
it does not create competing implementations. The production-component example
is `react_main/test/ui-audit/NewPageFixture.jsx`, at the fixture-only route
`/audit/new-page`. It has no page-specific CSS or inline styles. The route runner
asserts its heading, width, section spacing and field geometry at every width.

`UiPage` owns the shell. Width variants are `wide` (1180px maximum), `reading`
(820px), `prose` (80ch) and `full` (available width). The parent router can own
that shell; in that case use the standalone **same** `UiPageHeader` in the child,
not another nested shell. Keep page content continuous, with 24px section rhythm.

`UiPageHeader` owns the page title, description, leading artwork and actions.
All variants share a 24px/700/1.3 title with zero margins. `standard` is the
ordinary page; `editor` stacks actions/fields at phone widths; `moderation`
identifies the staff workspace without changing its side navigation; `forum`
is for discussion routes; `detail` allows identity metadata and leading artwork.
Variants express composition, not permission for another typography scale.
`identity` retains the centered title inside an authored profile's established
identity row rather than inserting another page heading above its banner. Its
optional `titleAction` uses the same shared button with inherited title type and
a real accessible label; name history is keyboard-operable without a clickable
Typography imitation. Profile columns, media, karma and information placement
are unchanged by that variant.

Router-owned shells wrap Play and Learn; reference details do not nest legacy
`inner-content` shells inside them. Family and profile routes own a wide UiPage
while retaining their existing two-column content layouts. Lobby uses `full`
to preserve desktop width for the visible community/homepage features.

Fields fill their intended form width; ordinary direct child actions keep their
intrinsic width in page/section columns, rather than becoming page-width bands.

`UiSection` supplies subordinate headings and optional actions. `UiCard` is a
meaningful bounded surface, not a default wrapper around every section. Preserve
actual game boards, authored profile/family media and user cosmetics. Do not
introduce a gallery of cards for continuous role/setup reference information.
`UiCard` supplies both the neutral background and its foreground color, rather
than inheriting text from an authored background. Profile identity/bio/reputation
insets preserve the authored color around their readable theme surface. Profile
statistics show exact results on a neutral surface, not a theme-dependent pie.
`UiStatRow` has `standard` (responsive, general summary) and `compact` (three
adjacent account values, maximum 480px) variants. The compact row prevents a
phone balance summary from wrapping its last value into a tall sparse card.
Use header children for status/filter metadata, not the header action slot;
read-only information is not an action. Shared surfaces reject page-specific
inline `style`/`sx` overrides.

Controls use `UiField` and `UiAction` with named variants rather than raw native
or direct MUI equivalents. Dialogs use `UiDialog`, explicit cancellation and
pending guards. Utility icons use `UiIcon` (HackerNoon Solid, native 24px slot);
currency uses `CoinIcon`. Existing role icons and seasonal wordmarks stay intact.

## Enforcement and current migration status

`npm run lint:ui` parses production JSX and rejects new legacy-control debt. It
also rejects raw `h1`/`component="h1"`/`variant="h1"`, removed header classes and
external `.ui-page*` CSS overrides and page-specific h1 CSS. The old `page-heading`,
`forum-directory-heading`, `moderation-heading`, `setup-editor-heading` and
`deck-editor-heading` implementations have been removed. Their replacement is
the component used by `UiPage` itself, not an alias retaining the old CSS.

The sole reviewed raw-h1 exception is the existing mobile **Game info** panel
in `pages/Game/Game.jsx`; it is not a site page header and retains the competitive
workspace arrangement. CSS exceptions are exact reviewed selectors for that
panel and authored Markdown/family-bio headings; they are not alternate page
headers. No ordinary page is exempt from the title rule.

The existing `test/ui-architecture-baseline.json` is migration debt, not a
reviewed final allowlist. It must only shrink. Direct MUI/native controls and
surfaces still in that file are **not a completed migration**. New icon import
and surface/CSS checks still need to cover every legacy path. Do not regenerate
the baseline to make a failure disappear.

Run Node architecture tests, `npm run lint:ui`, route geometry and visual captures
after each slice. A clean overflow assertion is not visual acceptance. The
comparative audit separately tracks missing master pairs and role/geometry
findings; consult `audit/README.md` for the current coverage limits.
