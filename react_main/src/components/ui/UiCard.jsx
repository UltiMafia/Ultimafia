import React from "react";

const variants = new Set(["padded", "flush"]);

export default function UiCard({ as: Component = "div", variant = "padded", className = "", children, ...props }) {
  if (!variants.has(variant)) throw new TypeError(`Unsupported UiCard variant: ${variant}`);
  return <Component className={`ui-card${variant === "flush" ? " ui-card--flush" : ""} ${className}`.trim()}
    data-ui-variant={variant === "flush" ? "flush" : undefined} {...props}>{children}</Component>;
}
