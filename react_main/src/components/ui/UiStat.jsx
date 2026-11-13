import React from "react";

export function UiStatRow({ children, className = "", variant = "standard" }) {
  if (!["standard", "compact"].includes(variant)) throw new TypeError(`Unsupported UiStatRow variant: ${variant}`);
  return <div className={`ui-stat-row ui-stat-row--${variant} ${className}`.trim()}>{children}</div>;
}

export function UiStat({ label, value, detail = null }) {
  return <div className="ui-stat">
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </div>;
}
