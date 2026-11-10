import React from "react";
import UiIcon from "./ui/UiIcon";

// One currency glyph for the whole site. The pixel coin stack matches the
// utility-icon family; the old raster coin read as a different design system.
export default function CoinIcon({ size = 16, className = "", alt = "" }) {
  return <span className={`coin-icon ${className}`.trim()} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
    <UiIcon name="coins" size={size} />
  </span>;
}
