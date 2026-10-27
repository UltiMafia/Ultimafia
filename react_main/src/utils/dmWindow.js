// Plain helpers for the floating DM window (components/dms). Kept free of
// React so they can be unit tested with node --test.

export const DM_WINDOW_STORAGE_KEY = "dmWindow";
export const DM_WINDOW_WIDTH = 360;
export const DM_WINDOW_HEIGHT = 460;
export const DM_TITLE_BAR_HEIGHT = 44;

// Game pages have the whole screen; the DM window never shows there.
export function isGamePath(pathname) {
  return /^\/game(\/|$)/.test(pathname || "");
}

// DM channel ids are md5 hashes of the sorted member ids (32 chars); public
// rooms use short ids. Same rule as the homepage chatbox.
export function isDirectChannelId(channelId) {
  return typeof channelId === "string" && channelId.length === 32;
}

// Number of DM conversations with at least one unread message.
export function countUnreadDmChannels(byChannel) {
  let n = 0;
  for (const id in byChannel || {})
    if (isDirectChannelId(id) && byChannel[id] > 0) n += 1;
  return n;
}

// Header button state from GET /api/chat/dmAccess.
export function dmButtonState(access) {
  if (access && access.locked)
    return {
      disabled: true,
      tooltip:
        access.message ||
        "Direct messages are locked while you're alive in a ranked or competitive game that's in progress.",
    };
  return { disabled: false, tooltip: "Direct messages" };
}

export const DEFAULT_DM_WINDOW_STATE = { open: false, collapsed: false, pos: null };

export function loadDmWindowState(storage) {
  try {
    const raw = storage && storage.getItem(DM_WINDOW_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DM_WINDOW_STATE };
    const s = JSON.parse(raw);
    const pos =
      s && s.pos && Number.isFinite(s.pos.x) && Number.isFinite(s.pos.y)
        ? { x: s.pos.x, y: s.pos.y }
        : null;
    return { open: !!(s && s.open), collapsed: !!(s && s.collapsed), pos };
  } catch (e) {
    return { ...DEFAULT_DM_WINDOW_STATE };
  }
}

export function saveDmWindowState(storage, state) {
  try {
    storage &&
      storage.setItem(
        DM_WINDOW_STORAGE_KEY,
        JSON.stringify({ open: !!state.open, collapsed: !!state.collapsed, pos: state.pos || null })
      );
  } catch (e) {}
}

// Keep at least the title bar on screen so the window can always be dragged back.
export function clampDmPos(pos, size, viewport) {
  const w = Math.min(size.width, viewport.width);
  return {
    x: Math.max(4, Math.min(pos.x, viewport.width - w - 4)),
    y: Math.max(4, Math.min(pos.y, viewport.height - DM_TITLE_BAR_HEIGHT - 4)),
  };
}
