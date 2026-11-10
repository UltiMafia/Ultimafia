import React from "react";

export function UiStatRow({ children, className = "" }) {
  return <div className={`ui-stat-row ${className}`.trim()}>{children}</div>;
}

export function UiStat({ label, value, detail = null }) {
  return <div className="ui-stat">
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </div>;
}
