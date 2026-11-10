import React, { createContext, forwardRef, useContext } from "react";
import { pixelIconLayout } from "./pixelIcons";
import { uiIconSets } from "./iconSets";
import { uiTokens } from "./designTokens";
import "./ui.css";

// Comparison families are supplied by review fixtures, never bundled into the
// application. A chosen production family still lives in the central registry.
export const UiIconFamilyContext = createContext(null);

// Utility icons only: never resample role sprites, emotes or uploaded artwork.
// Controls own the accessible name; standalone meaningful icons provide label.
function SvgElement({ element }) {
  return React.createElement(element.type, element.attrs, element.children?.length ? element.children.map((child, index) => <SvgElement key={index} element={child} />) : undefined);
}

const UiIcon = forwardRef(function UiIcon({ name, size = 24, label, set, className = "", style, ...props }, ref) {
  const { extent } = pixelIconLayout(size);
  const previewFamily = useContext(UiIconFamilyContext);
  const family = (set ? uiIconSets[set] : previewFamily) || uiIconSets[uiTokens.iconSet];
  const iconName = Object.prototype.hasOwnProperty.call(family.icons, name) ? name : "info";
  const icon = family.icons[iconName];
  return <svg {...props} ref={ref} className={`ui-icon ${className}`}
    xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${family.grid} ${family.grid}`}
    width={extent} height={extent} data-icon={iconName} data-icon-set={set || family.id || uiTokens.iconSet} data-icon-source={icon.source} shapeRendering={extent % family.grid === 0 ? "crispEdges" : "geometricPrecision"}
    style={{ width: extent, height: extent, ...style }} focusable="false"
    aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
    {icon.elements.map((element, index) => <SvgElement key={index} element={element} />)}
  </svg>;
});

export default UiIcon;
