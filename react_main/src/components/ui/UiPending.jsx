import React, { useEffect, useState } from "react";
import "./ui.css";

// Delay only the visual indicator, never readiness or mounting real content.
// Fast operations should not flash a spinner or impose a minimum loading time.
export default function UiPending({ label = "Loading…", compact = false, inline = false }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);
  return <div className={`ui-pending${compact ? " ui-pending--compact" : ""}${inline ? " ui-pending--inline" : ""}`} role="status" aria-live="polite">
    {visible && <><span className="ui-pending-mark" aria-hidden="true" /><span>{label}</span></>}
  </div>;
}
