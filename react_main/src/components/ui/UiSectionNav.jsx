import React from "react";
import { Link } from "react-router-dom";
import UiIcon from "./UiIcon";
import "./ui.css";

// One section-navigation treatment for every page that needs a secondary menu.
// Pages supply their own routes, labels and optional icons; presentation and the
// phone layout are shared so two sidebars cannot drift apart again.
export function UiSectionNav({ label, className = "", children, ...props }) {
  return <nav className={`ui-section-nav ${className}`.trim()} aria-label={label} {...props}>{children}</nav>;
}

export function UiSectionNavItem({ to, active = false, icon, children, className = "", ...props }) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`ui-section-nav-item${active ? " is-active" : ""} ${className}`.trim()}
      {...props}
    >
      {icon ? <UiIcon name={icon} size={20} /> : null}
      <span>{children}</span>
    </Link>
  );
}

export default UiSectionNav;
