import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

import { UserContext } from "../../Contexts";
import {
  isGamePath,
  loadDmWindowState,
  saveDmWindowState,
} from "../../utils/dmWindow";

const POLL_MS = 15 * 1000;

const noop = () => {};
export const DmWindowContext = createContext({
  open: false,
  collapsed: false,
  pos: null,
  channelId: null,
  access: { locked: false },
  unread: 0,
  toggle: noop,
  close: noop,
  setCollapsed: noop,
  setPos: noop,
  setChannelId: noop,
  setLiveUnread: noop,
  refreshAccess: noop,
});

export function useDmWindow() {
  return useContext(DmWindowContext);
}

function sessionStore() {
  try {
    return window.sessionStorage;
  } catch (e) {
    return null;
  }
}

// Open/collapsed/position of the floating DM window, kept for the browser
// tab (sessionStorage) so it survives page changes and reloads. Also polls
// GET /api/chat/dmAccess for the lock state and the unread count shown on the
// header button while the window is closed.
export function DmWindowProvider({ children }) {
  const user = useContext(UserContext);
  const location = useLocation();
  const [state, setState] = useState(() => loadDmWindowState(sessionStore()));
  const [access, setAccess] = useState({ locked: false });
  const [polledUnread, setPolledUnread] = useState(0);
  // While the window is mounted its socket gives the live count.
  const [liveUnread, setLiveUnread] = useState(null);

  useEffect(() => {
    saveDmWindowState(sessionStore(), state);
  }, [state]);

  const refreshAccess = useCallback(() => {
    if (!user.loggedIn) return;
    axios
      .get("/api/chat/dmAccess")
      .then((res) => {
        const data = res.data || {};
        setAccess({
          locked: !!data.locked,
          message: data.message,
          gameId: data.gameId,
        });
        setPolledUnread(Number(data.unreadChannels) || 0);
      })
      .catch(() => {});
  }, [user.loggedIn]);

  // Re-check on login, on page changes (entering or leaving a game) and on a
  // timer (deaths and game starts happen without a page change).
  useEffect(() => {
    if (!user.loggedIn) return undefined;
    refreshAccess();
    const id = setInterval(refreshAccess, POLL_MS);
    return () => clearInterval(id);
  }, [user.loggedIn, user.inGame, refreshAccess]);

  const onGamePage = isGamePath(location.pathname);
  useEffect(() => {
    if (!onGamePage) refreshAccess();
  }, [onGamePage]);

  const toggle = useCallback(() => {
    setState((s) =>
      s.open && !s.collapsed ? { ...s, open: false } : { ...s, open: true, collapsed: false }
    );
  }, []);
  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false, collapsed: false, channelId: null }));
    setLiveUnread(null);
  }, []);
  const setCollapsed = useCallback(
    (collapsed) => setState((s) => ({ ...s, collapsed: !!collapsed })),
    []
  );
  const setPos = useCallback((pos) => setState((s) => ({ ...s, pos })), []);
  // The conversation open in the window (null = the list), so it comes back
  // after a page change or reload.
  const setChannelId = useCallback(
    (channelId) =>
      setState((s) => (s.channelId === channelId ? s : { ...s, channelId: channelId || null })),
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      access,
      unread: state.open && liveUnread != null ? liveUnread : polledUnread,
      toggle,
      close,
      setCollapsed,
      setPos,
      setChannelId,
      setLiveUnread,
      refreshAccess,
    }),
    [state, access, liveUnread, polledUnread, toggle, close, setCollapsed, setPos, setChannelId, refreshAccess]
  );

  return (
    <DmWindowContext.Provider value={value}>{children}</DmWindowContext.Provider>
  );
}
