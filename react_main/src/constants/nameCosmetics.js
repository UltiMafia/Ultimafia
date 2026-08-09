/** Fonts for in-game player-list names only (not site theme / chat). */
export const NAME_FONT_STACKS = {
  default: null, // inherit
  slab: "RobotoSlab, serif",
  mono: "RobotoMono, monospace",
  autophobia: "Autophobia, cursive",
  spooky: "Spooky, cursive",
  nabla: "Nabla, fantasy",
};

export const ANIMATED_NAME_COLOR_STYLES = [
  "none",
  "pulse",
  "glow",
  "rainbow",
  "patriotic",
  "gradient",
  "tricolor",
];

export function resolveNameFontStack(nameFont) {
  if (!nameFont || nameFont === "default") return null;
  return NAME_FONT_STACKS[nameFont] || null;
}
