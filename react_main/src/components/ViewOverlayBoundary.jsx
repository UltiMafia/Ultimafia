import React, { useCallback, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";

// Portals owned by a retained view belong to that view, not document.body.
// This covers dialogs with private open state as well as shared popovers.
// Hidden views must not enforce focus or lock scrolling on the visible view.
export default function ViewOverlayBoundary({ active, children }) {
  // Child portal layout effects can run before a parent ref is attached. Make
  // attachment reactive so Portal retries instead of retaining document.body.
  const [containerNode, setContainerNode] = useState(null);
  const container = useCallback(() => containerNode, [containerNode]);
  const theme = useCallback((parent) => {
    const components = { ...parent.components };
    for (const name of ["MuiModal", "MuiDialog", "MuiDrawer", "MuiPopover", "MuiMenu", "MuiPopper"]) {
      const component = components[name] || {};
      components[name] = {
        ...component,
        defaultProps: {
          ...component.defaultProps,
          container,
          ...(!active && name !== "MuiPopper" ? {
            disableAutoFocus: true,
            disableEnforceFocus: true,
            disableRestoreFocus: true,
            disableScrollLock: true,
            disableEscapeKeyDown: true,
          } : {}),
        },
      };
    }
    return { ...parent, components };
  }, [active, container]);

  return (
    <div ref={setContainerNode} style={{ display: active ? "contents" : "none" }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </div>
  );
}
