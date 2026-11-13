import React, { createContext, useContext } from "react";
import "./ui.css";

const ReferenceVariant = createContext("picker");
const variants = new Set(["directory", "picker"]);

export function UiReferenceToolbar({ navigation, search, children }) {
  return <div className="ui-reference-toolbar">
    <div className="ui-reference-filters">{navigation}<div className="ui-reference-search">{search}</div></div>
    {children}
  </div>;
}

// References are continuous information; a picker is a bounded, scrollable
// editing control. Keeping the distinction here prevents setup-specific CSS
// from accidentally turning the Learn directory into another card gallery.
export function UiReferenceList({ label, items, getItemKey, renderEntry, variant = "directory" }) {
  if (!variants.has(variant)) throw new TypeError(`Unsupported UiReferenceList variant: ${variant}`);
  return <ReferenceVariant.Provider value={variant}>
    {items.length ? <ul className={`ui-reference-list ui-reference-list--${variant}`} aria-label={label}>
      {items.map(item => <li key={getItemKey(item)}>{renderEntry(item)}</li>)}
    </ul> : <p className="ui-reference-empty" role="status">No matching entries.</p>}
  </ReferenceVariant.Provider>;
}

export function UiReferenceEntry({ name, description, icon, actions }) {
  const variant = useContext(ReferenceVariant);
  if (!name) return <div className="ui-reference-placeholder" aria-hidden="true" />;
  const descriptions = (Array.isArray(description) ? description : [description]).filter(Boolean);
  const visible = variant === "picker" ? descriptions.slice(0, 1) : descriptions;
  return <div className={`ui-reference-entry ui-reference-entry--${variant}`}>
    {icon && <div className="ui-reference-icon">{icon}</div>}
    <div className="ui-reference-copy">
      <strong className="ui-reference-name">{name}</strong>
      {!!visible.length && <div className="ui-reference-description">{visible.map((text, index) => <p key={index}>{text}</p>)}</div>}
    </div>
    {actions && <div className="ui-reference-actions">{actions}</div>}
  </div>;
}
