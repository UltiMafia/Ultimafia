import Color from "color";

// Resolve channels once per render, not with style/layout reads per animation frame.
// drop-shadow already includes the glyph alpha; do not multiply that alpha twice.
export function nameGlowStyle(color) {
  try {
    const parsed = Color(color);
    // A light name already reads as light: the same alpha that reads as a halo on
    // a mid colour blows a white name into a solid bar. Normalise around the
    // mid colour the halo was calibrated on, so every name gets the same
    // perceived strength.
    const luminance = nameGlowLuminance(color);
    const strength =
      (0.9 + 0.1 * parsed.alpha()) *
      (luminance == null ? 1 : luminanceScale(luminance));
    return {
      "--name-glow-dim-alpha": 0.75 * strength,
      "--name-glow-peak-alpha": 0.61 * strength,
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
