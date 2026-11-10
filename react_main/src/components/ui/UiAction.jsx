import React, { forwardRef } from "react";
import "./ui.css";

const UiAction = forwardRef(function UiAction({
  variant = "secondary", iconOnly = false, busy = false, disabled = false,
  className = "", children, onClick, type = "button", ...props
}, ref) {
  return <button {...props} ref={ref} type={type} disabled={disabled || busy}
    aria-busy={busy || undefined}
    className={`ui-action ui-action--${variant}${iconOnly ? " ui-action--icon" : ""} ${className}`}
    onClick={event => {
      if (disabled || busy) { event.preventDefault(); return; }
      onClick?.(event);
    }}>
    {busy && <span className="ui-progress" aria-hidden="true" />}
    {children}
  </button>;
});

export default UiAction;
