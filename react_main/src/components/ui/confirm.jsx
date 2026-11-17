import React, { useEffect, useState } from "react";
import UiDialog from "./UiDialog";
import UiAction from "./UiAction";

// One shared confirmation surface for the whole site. Callers await a boolean;
// the native window.confirm is only a fallback when no host is mounted (tests or
// non-React callers), and is the single sanctioned use of that API.
let enqueue = null;

export function confirmAction(options = {}) {
  const config = typeof options === "string" ? { message: options } : options;
  return new Promise((resolve) => {
    if (enqueue) {
      enqueue({ ...config, resolve });
      return;
    }
    resolve(typeof window === "undefined" ? false : window.confirm(config.message || "Are you sure?"));
  });
}

export function ConfirmHost() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    enqueue = (request) => setQueue((current) => [...current, request]);
    return () => { enqueue = null; };
  }, []);

  const current = queue[0];
  if (!current) return null;

  const settle = (value) => {
    current.resolve(value);
    setQueue((list) => list.slice(1));
  };

  return (
    <UiDialog
      title={current.title || "Confirm"}
      description={current.message}
      onClose={() => settle(false)}
      actions={<>
        <UiAction variant="secondary" onClick={() => settle(false)}>{current.cancelLabel || "Cancel"}</UiAction>
        <UiAction variant={current.danger === false ? "primary" : "danger"} onClick={() => settle(true)}>{current.confirmLabel || "Confirm"}</UiAction>
      </>}
    />
  );
}
