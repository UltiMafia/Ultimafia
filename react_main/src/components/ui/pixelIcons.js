import artwork, { pixelarticonSources } from "./pixelarticons/icons.js";

// The artwork is unmodified Pixelarticons, not locally drawn or thickened paths.
// Original SVGs, license, pinned revision and hashes live in ./pixelarticons/.
export const PIXEL_ICON_GRID = 24;
export const pixelIconSources = pixelarticonSources;
export const pixelIcons = Object.fromEntries(Object.entries(pixelIconSources)
  .map(([name, source]) => [name, { source, paths: artwork[source] }]));
export const pixelIconPaths = Object.fromEntries(Object.entries(pixelIcons)
  .map(([name, icon]) => [name, icon.paths.map(path => path.d).join(" ")]));

// Primary controls default to the library's native 24px. Compact callers retain
// their requested dimensions; the upstream 24px source geometry never changes.
export function pixelIconLayout(size = 24) {
  const requested = Number(size);
  return { extent: Number.isFinite(requested) && requested > 0 ? Math.max(16, Math.round(requested)) : 24 };
}
