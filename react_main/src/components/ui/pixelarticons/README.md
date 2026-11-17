# Pixelarticons — free subset

Original artwork by **Gerrit Halfmann**, licensed MIT. See `LICENSE.txt`.
Upstream: https://github.com/halfmage/pixelarticons
Browse the free set: https://pixelarticons.com/free/

`SOURCE.json` records the pinned upstream revision, download URLs and SHA-256
hashes. The SVG artwork is unchanged. `icons.js` contains extracted path data for
local React rendering; no icon CDN, font, package installer or runtime fetch is
used. The original MIT notice is also distributed in
`public/licenses/pixelarticons.txt`.

Regenerate the subset with `python3 test/import-pixelarticons.py`. The importer
validates the SVG structure and refuses to overwrite changed original assets.
Update `source-map.json` to map UI meanings to actual free library icons. Do not
invent missing variants or modify their pixel geometry to approximate paid icons.

The free set has one heart/star drawing: selected state remains expressed by the
existing color, border and `aria-pressed` contract. Pinned messages use the
library's bookmark; moderation uses its shield; disconnection uses unlink.

The library's native size is **24px**, used by primary controls. Explicit compact
callers can still request smaller display sizes; those are scaled displays, not
a claim of native 16px artwork. Role sprites, uploaded imagery and the original
site wordmark are not part of this library or conversion.
