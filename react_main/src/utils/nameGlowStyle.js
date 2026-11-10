import Color from "color";

// Resolve channels once per render, not with style/layout reads per animation frame.
// drop-shadow already includes the glyph alpha; do not multiply that alpha twice.
export function nameGlowStyle(color) {
  try {
    const parsed = Color(color);
    // The glow is a text-shadow, so it is painted at the glyph colour's own
    // alpha - there is no cumulative filter to calibrate against any more.
    const strength = 0.9 + 0.1 * parsed.alpha();
    return {
      "--name-glow-dim-alpha": String(strength),
      "--name-glow-peak-alpha": String(strength),
      "--name-glow-rgb": parsed.rgb().array().slice(0, 3).join(" "),
    };
  } catch {
    // Inherited/unresolved CSS colors use the theme-channel fallback in user.css.
    return {};
  }
}

export function applyNameGlowStyle(element, styles) {
  const previous = Object.keys(styles).map((key) => ({
    key,
    value: element.style.getPropertyValue(key),
    priority: element.style.getPropertyPriority(key),
  }));
  for (const [key, value] of Object.entries(styles)) {
    element.style.setProperty(key, value);
  }
  return () => {
    for (const { key, value, priority } of previous) {
      if (value !== "") element.style.setProperty(key, value, priority);
      else element.style.removeProperty(key);
    }
  };
}
