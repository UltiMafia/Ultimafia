// Name cosmetics are the only place the app switches to a downloadable face, so
// a name can paint in a fallback font and then swap when its file arrives. That
// swap changes the line box height, which moves every message below it - most
// visibly on a phase switch, where a whole screen of rows paints at once.
//
// Warm the faces a game can actually use as soon as the game's players are
// known, so the swap happens before any transcript paints. `document.fonts.load`
// resolves once the face is usable; failures are ignored because a missing face
// only means the name keeps its fallback.
const NAME_FONT_FAMILIES = {
  autophobia: 'Autophobia',
  bettynoir: 'BettyNoir',
  comic: 'Comic Sans MS',
  georgia: 'Georgia',
  mono: 'RobotoMono',
  nabla: 'Nabla',
  poppins: 'Poppins',
  slab: 'RobotoSlab',
  spooky: 'Spooky',
  trebuchet: 'Trebuchet MS',
  verdana: 'Verdana',
};

export function nameFontFamily(nameFont) {
  if (!nameFont || nameFont === 'default') return null;
  return NAME_FONT_FAMILIES[nameFont] || null;
}

// Only the families that ship as files can be slow; the rest are system faces.
const DOWNLOADABLE = new Set(['Autophobia', 'BettyNoir', 'Nabla', 'Poppins', 'RobotoMono', 'RobotoSlab', 'Spooky']);

export function warmNameFonts(nameFonts) {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return Promise.resolve();

  const families = new Set();
  (nameFonts || []).forEach((nameFont) => {
    const family = nameFontFamily(nameFont);
    if (family && DOWNLOADABLE.has(family)) families.add(family);
  });
  if (!families.size) return Promise.resolve();

  return Promise.all(
    [...families].map((family) =>
      document.fonts.load(`bold 16px "${family}"`).catch(() => undefined)
    )
  );
}
