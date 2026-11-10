# Shared interface library

## Single sources of truth

This is the supported design path for new interfaces, not an optional alternate
theme. Import interactive controls from `components/ui`; layout helpers such as
MUI Box/Stack may still be used directly. MUI-backed fields/type primitives share
the same tokens; do not add another button/dialog/loading/icon package.

`npm run lint:ui` and `test/uiArchitecture.test.mjs` enforce this boundary. The
explicit file/kind/count baseline records existing direct control imports,
native controls, Card/Paper imports and browser dialogs outside the library. New files have no
exemptions; existing files cannot increase those counts. Reductions are allowed.
New game-specific board/canvas targets require a reviewed exception, not a
second utility UI. Do not regenerate the baseline to make a violation pass.
After a migration, `--reduce-baseline` only lowers/removes exception counts so a
removed legacy pattern cannot quietly return. The historical baseline-writing
and surface-extension commands are now rejected; they cannot silently add debt.

- `designTokens.js`: default red/yellow palettes, type scale, weights, line
  heights, action sizes and icon family. `getSiteTheme` configures MUI from these
  values and publishes the matching CSS custom properties through CssBaseline.
- `fonts.css`: self-hosted Fira Sans faces. Explicit classic/system/readable user
  choices remain in `constants/fontFamilies.js`; user-generated text cosmetics
  are not overwritten by utility UI styling.
- `ui.css`: native action, dialog, editor and shared layout presentation. Feature
  styles should arrange these components, not redefine their fonts or colors.

Use the public exports from `components/ui`:

```jsx
import { UiAction, UiDialog, UiField, UiText } from "components/ui";

<UiDialog title="Raise amount" onClose={cancel} actions={<>
  <UiAction onClick={cancel}>Cancel</UiAction>
  <UiAction variant="primary" onClick={confirm}>Confirm</UiAction>
</>}>
  <UiField label="Amount" type="number" value={amount} onChange={change} />
</UiDialog>
```

`UiField` and `UiText` expose the theme-configured MUI primitives; there is not a
second independent form/type styling system. `UiAction` is a native button with
real disabled/busy states, keyboard focus and shared sizing. Navigation remains
an actual link. `MessageComposer` owns presentation only; game/site/DM transports,
permissions, drafts and acknowledgements stay with their respective adapters.

Primary actions share a small dark 3px bottom edge, with a 2px pressed offset;
MUI legacy contained-primary buttons and UiAction consume the same tokens.
Secondary controls remain quiet and disabled controls never retain a raised edge.

`UiPending` is the shared pending state. It only delays its visual indicator by
150ms to avoid flashes; it never delays content readiness. Legacy `Loading`
delegates to it instead of rendering independent full-viewport bars. Keep old
content visible during refresh and avoid mounting unrelated requests as blockers.

`UiDialog` supplies the common title, scrolling body, action region, focus trap,
Escape and Back dismissal. `dismissible={false}` is for required decisions such
as veto requests. It hides immediately with its owner view. Intentionally global
ready checks must keep their global lifecycle, not be blindly migrated here.

## Page structure

Use `UiPage` for an unframed page heading, optional actions/navigation and a
continuous content area. `UiSection` groups related content using a heading and
spacing; `UiList`/`UiListItem` provide aligned, divider-separated collections.
Layout widths and section/column gaps come from the central tokens.

Do not wrap ordinary pages or every heading/body pair in Card/Paper. Avoid
repeated heading strips, alternating inset backgrounds and ornamental panels.
Use an actual surface when it communicates a boundary: dialogs, menus, editors,
selected controls or meaningful game/user content. Do not globally make Paper
transparent: that breaks overlays, custom profiles and readable user media.
Existing inputs, focused/selected states and raised primary actions keep their
affordances. Reducing panel segmentation does not mean eliminating all depth.

Product cards are a meaningful boundary, not page segmentation. `UiProductCard`
keeps a product's title, description, ownership, price and explicit purchase
action together; use `ui-product-grid` for the responsive collection. Do not
replace these with ambiguous full-row click targets merely to avoid cards.

The competitive game workspace is deliberately conservative. Site page-layout
changes do not authorize altering its panel proportions, phase navigation,
identity/role placement or vote presentation. Scope shared layout changes and
test long player names, history/review, available speech abilities and Send
geometry before accepting any gameplay-adjacent control change.

## Game-specific content

Cards, dice, boards, faction colors and original role/phase sprites are game
content, not interchangeable action icons. Keep that imagery and its gameplay
meaning; use shared actions around it. Never replace the wordmark or uploaded
media. Phone Chat, Players and Actions stay at the bottom. History and occasional
utilities are at the top, separate from a floating corner clock. Unnecessary
chrome disappears while typing. Single-meeting chat does not need a tab strip.

Do not shrink primary actions to a special 11px/12px label to fit a row. Change
the row layout or wrap it. Primary action text uses the shared body type size;
secondary metadata uses the shared small/caption tokens.

## Icons and licenses

The user-selected default is HackerNoon Solid from the original Pixel Icon Library, with
visible footer attribution and the CC BY 4.0 notice in `public/licenses/`.
Pixelarticons remains available for side-by-side review. Source hashes and pinned
revisions are recorded in each asset directory. No hand-thickening or invented
paid variants. The existing day/night/result sprites stay outside `UiIcon`.

## Verification

Use the core/control, design-system and minigame review fixtures with production
components and controlled transports. Inspect native-size dark/light desktop and
phone captures, not only token tests or an icon sheet. Dialog component coverage
is not proof that every minigame board, turn or live integration has been tested.
