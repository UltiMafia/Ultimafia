import React from "react";
import "./ui.css";

// Page hierarchy is spacing and headings, not a containing card. Surfaces are
// reserved for overlays, editors and interactions that need a distinct boundary.
export default function UiPage({ title, description, actions, navigation, children, width = "wide", variant = "standard", className = "", ...props }) {
  return <div {...props} className={`ui-page ui-page--${width} ${className}`}>
    {(title || actions || description) && <UiPageHeader title={title} description={description} actions={actions} variant={variant} />}
    {navigation && <div className="ui-page-navigation">{navigation}</div>}
    <div className="ui-page-content">{children}</div>
  </div>;
}

// Standalone for routes whose shell belongs to a parent router. This is the
// same header UiPage renders, not a second page-specific heading system.
export function UiPageHeader({ title, description, actions, variant = "standard", children, leading, className = "", ...props }) {
  return <header {...props} className={`ui-page-heading ui-page-heading--${variant} ${className}`} data-ui-page-header={variant}>
    {leading && <div className="ui-page-leading">{leading}</div>}
    <div className="ui-page-heading-copy"><h1>{title}</h1>{description && <p>{description}</p>}{children}</div>
    {actions && <div className="ui-page-actions">{actions}</div>}
  </header>;
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
