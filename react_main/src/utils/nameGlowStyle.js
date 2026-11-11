import Color from "color";

// Perceived brightness of a name colour, 0 (black) to 1 (white).
export function nameGlowLuminance(color) {
  try {
    const [r, g, b] = Color(color).rgb().array();
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  } catch {
    return null;
  }
}

// The halo's alphas are calibrated on a mid colour; a light name needs less of
// them to look like light rather than a lit bar, a dark one can take more.
const REFERENCE_LUMINANCE = 0.61;
const LUMINANCE_SLOPE = 1.2;
const MIN_LUMINANCE_SCALE = 0.55;
const MAX_LUMINANCE_SCALE = 1.35;

function luminanceScale(luminance) {
  const scale = 1 + LUMINANCE_SLOPE * (REFERENCE_LUMINANCE - luminance);
  return Math.min(
    MAX_LUMINANCE_SCALE,
    Math.max(MIN_LUMINANCE_SCALE, scale)
  );
}

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
      // Chromium halo-energy comparison against the old filtered peak: an 8%
      // alpha increase retains its strength without WebKit's clipped layer.
      "--name-glow-peak-alpha": 0.61 * strength * 1.08,
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
