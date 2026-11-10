import React from "react";

export default function UiCard({ as: Component = "div", className = "", children, ...props }) {
  return <Component className={`ui-card ${className}`.trim()} {...props}>{children}</Component>;
}
