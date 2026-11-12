import React from "react";
import "./ui.css";

// A breadcrumb trail is navigation, but it is not a section menu: it takes the
// minimum target size rather than the 44px section contract, and it must not be
// re-implemented as a raw <nav> on each page.
export function UiBreadcrumb({ label = "Breadcrumb", className = "", children, ...props }) {
  return <nav className={`ui-breadcrumb ${className}`.trim()} aria-label={label} {...props}>{children}</nav>;
}

export default UiBreadcrumb;
