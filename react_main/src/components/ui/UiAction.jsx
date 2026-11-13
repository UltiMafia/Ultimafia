import React, { forwardRef } from "react";
import "./ui.css";

const UiAction = forwardRef(function UiAction({
  component: Component = "button",
  variant = "secondary", iconOnly = false, busy = false, disabled = false,
  className = "", children, onClick, type = "button", ...props
}, ref) {
  const isButton = Component === "button";
  return <Component {...props} ref={ref}
    type={isButton ? type : undefined}
    disabled={isButton ? (disabled || busy) : undefined}
    aria-disabled={(!isButton && (disabled || busy)) || undefined}
    aria-busy={busy || undefined}
    className={`ui-action ui-action--${variant}${iconOnly ? " ui-action--icon" : ""}${disabled || busy ? " is-disabled" : ""} ${className}`}
    onClick={event => {
      if (disabled || busy) { event.preventDefault(); return; }
      onClick?.(event);
    }}>
    {busy && <span className="ui-progress" aria-hidden="true" />}
    {children}
  </Component>;
});

export default UiAction;
