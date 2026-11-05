import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  bringToFront,
  clampWindowPos,
  clampWindowSize,
  loadStrategyWindows,
  openWindow,
  saveStrategyWindows,
  viewportSize,
} from "../../utils/strategyWindow";

const noop = () => {};

export const StrategyWindowsContext = createContext({
  // False outside the app shell: the pop-out button stays hidden where no
  // layer is mounted to show the window.
  enabled: false,
  windows: [],
  openStrategyWindow: noop,
  closeWindow: noop,
  updateWindow: noop,
  focusWindow: noop,
  toggleCollapsed: noop,
  closeAll: noop,
});

export function useStrategyWindows() {
  return useContext(StrategyWindowsContext);
}

function sessionStore() {
  try {
    return window.sessionStorage;
  } catch (e) {
    return null;
  }
}

// The open guide windows live at the app shell (Main.jsx) rather than in the
// game page, so a guide can stay on screen while the user plays, and while they
// browse setups. The stack is kept for the browser tab (sessionStorage) so it
// survives page changes and reloads.
export function StrategyWindowsProvider({ children }) {
  const [windows, setWindows] = useState(() =>
    loadStrategyWindows(sessionStore())
  );

  useEffect(() => {
    saveStrategyWindows(sessionStore(), windows);
  }, [windows]);

  // A smaller window (or a rotatable display) must not leave a guide hanging
  // off screen where it cannot be grabbed.
  useEffect(() => {
    function onResize() {
      const viewport = viewportSize();
      setWindows((prev) => {
        let changed = false;
        const next = prev.map((win) => {
          const size = clampWindowSize(win, viewport);
          const pos = clampWindowPos({ x: win.x, y: win.y }, size, viewport);
          if (
            pos.x === win.x &&
            pos.y === win.y &&
            size.width === win.width &&
            size.height === win.height
          )
            return win;
          changed = true;
          return { ...win, ...pos, ...size };
        });
        return changed ? next : prev;
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const openStrategyWindow = useCallback((setupId, options) => {
    let openedId = null;
    setWindows((prev) => {
      const result = openWindow(prev, setupId, viewportSize(), options);
      openedId = result.id;
      return result.windows;
    });
    return openedId;
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => prev.filter((win) => win.id !== id));
  }, []);

  const updateWindow = useCallback((id, patch) => {
    setWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, ...patch } : win))
    );
  }, []);

  const focusWindow = useCallback((id) => {
    setWindows((prev) => bringToFront(prev, id));
  }, []);

  const toggleCollapsed = useCallback((id) => {
    setWindows((prev) =>
      prev.map((win) =>
        win.id === id ? { ...win, collapsed: !win.collapsed } : win
      )
    );
  }, []);

  const closeAll = useCallback(() => setWindows([]), []);

  const value = useMemo(
    () => ({
      enabled: true,
      windows,
      openStrategyWindow,
      closeWindow,
      updateWindow,
      focusWindow,
      toggleCollapsed,
      closeAll,
    }),
    [
      windows,
      openStrategyWindow,
      closeWindow,
      updateWindow,
      focusWindow,
      toggleCollapsed,
      closeAll,
    ]
  );

  return (
    <StrategyWindowsContext.Provider value={value}>
      {children}
    </StrategyWindowsContext.Provider>
  );
}
