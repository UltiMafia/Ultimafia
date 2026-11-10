import React from "react";
import "./ui.css";

// Page hierarchy is spacing and headings, not a containing card. Surfaces are
// reserved for overlays, editors and interactions that need a distinct boundary.
export default function UiPage({ title, description, actions, navigation, children, width = "wide", className = "", ...props }) {
  return <div {...props} className={`ui-page ui-page--${width} ${className}`}>
    {(title || actions || description) && <header className="ui-page-heading">
      <div>{title && <h1>{title}</h1>}{description && <p>{description}</p>}</div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </header>}
    {navigation && <div className="ui-page-navigation">{navigation}</div>}
    <div className="ui-page-content">{children}</div>
  </div>;
}

export function UiSection({ title, actions, children, className = "", headingLevel = 2, ...props }) {
  const Heading = `h${headingLevel}`;
  return <section {...props} className={`ui-section ${className}`}>
    {(title || actions) && <header className="ui-section-heading">
      {title && <Heading>{title}</Heading>}{actions && <div className="ui-section-actions">{actions}</div>}
    </header>}
    {children}
  </section>;
}

export function UiList({ children, className = "", ...props }) {
  return <ul {...props} className={`ui-list ${className}`}>{children}</ul>;
}

export function UiListItem({ children, className = "", ...props }) {
  return <li {...props} className={`ui-list-item ${className}`}>{children}</li>;
}
