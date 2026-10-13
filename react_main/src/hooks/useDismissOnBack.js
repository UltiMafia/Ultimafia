import { useEffect, useRef } from "react";

// Closes an overlay when the browser or Android Back button is pressed.
//
// Opening an overlay pushes a same-URL history entry, so Back is consumed by
// the overlay instead of leaving the page, and the route does not change. A
// module-level stack means only the most recently opened overlay is closed when
// Back is pressed.
const overlayStack = [];
let listenerInstalled = false;

function installListener() {
  if (listenerInstalled) return;
  listenerInstalled = true;
  window.addEventListener("popstate", () => {
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

    const entry = {
      close: () => {
        if (onCloseRef.current) onCloseRef.current();
      },
    };
    overlayStack.push(entry);

    window.history.pushState({ __overlay: true }, "");

    return () => {
      const index = overlayStack.indexOf(entry);
      if (index !== -1) overlayStack.splice(index, 1);
    };
  }, [isOpen]);
}
