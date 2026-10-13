import { useEffect, useRef } from "react";

// Closes an overlay when the browser or Android Back button is pressed.
//
// Opening an overlay pushes a same-URL history entry, so Back is consumed by
// the overlay instead of leaving the page. When the overlay is closed from its
// own UI (not by Back) that marker entry is removed again, so opening and
// closing an overlay does not leave a dead history entry that later needs an
// extra Back press. A module-level stack means only the most recently opened
// overlay is closed when Back is pressed.
const overlayStack = [];
let listenerInstalled = false;
let programmaticBack = false;

function installListener() {
  if (listenerInstalled) return;
  listenerInstalled = true;
  window.addEventListener("popstate", () => {
    if (programmaticBack) {
      programmaticBack = false;
      return;
    }
    const entry = overlayStack[overlayStack.length - 1];
    if (entry) entry.close();
  });
}

export function useDismissOnBack(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    installListener();

    const id = `overlay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const entry = {
      close: () => {
        if (onCloseRef.current) onCloseRef.current();
      },
    };
    overlayStack.push(entry);

    window.history.pushState({ __overlay: id }, "");

    return () => {
      const index = overlayStack.indexOf(entry);
      if (index !== -1) overlayStack.splice(index, 1);

      // If our marker is still the current entry (the overlay was closed from
      // its own UI, not by Back), remove it.
      const state = window.history.state;
      if (state && state.__overlay === id) {
        programmaticBack = true;
        window.history.back();
      }
    };
  }, [isOpen]);
}
