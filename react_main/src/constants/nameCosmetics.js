/** Fonts for in-game names (player list + chat nameplates; not site theme). */
export const NAME_FONT_STACKS = {
  default: null, // inherit
  slab: "RobotoSlab, Georgia, serif",
  mono: "RobotoMono, Consolas, monospace",
  poppins: "Poppins, 'Segoe UI', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  trebuchet: "'Trebuchet MS', 'Segoe UI', sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  bettynoir: "BettyNoir, Georgia, serif",
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
