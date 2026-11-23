// Plain helpers for the floating strategy (guide) windows
// (components/strategyWindows). Kept free of React so they can be unit tested
// with node --test, the same way utils/dmWindow.js is.

export const STRATEGY_WINDOWS_STORAGE_KEY = "strategyWindows";
export const STRATEGY_WINDOW_WIDTH = 420;
export const STRATEGY_WINDOW_HEIGHT = 460;
export const STRATEGY_TITLE_BAR_HEIGHT = 44;
export const STRATEGY_WINDOW_MIN_WIDTH = 280;
export const STRATEGY_WINDOW_MIN_HEIGHT = 200;
// Gap kept between a window and the viewport edge. A guide is meant to be
// read, so a window always stays fully on screen instead of being allowed to
// hang its body off the bottom.
export const STRATEGY_WINDOW_MARGIN = 4;

let windowCounter = 0;

function nextId() {
  windowCounter += 1;
  return `strategy-window-${windowCounter}-${Math.floor(Math.random() * 1e6)}`;
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function nextSeq(windows) {
  return (windows || []).reduce((max, win) => Math.max(max, num(win && win.seq, 0)), 0) + 1;
}

export function viewportSize() {
  if (typeof window === "undefined") return { width: 1280, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}

// Keeps the whole window inside the viewport, so it can always be read and
// grabbed again.
export function clampWindowPos(pos, size, viewport) {
  const width = Math.min(
    num(size && size.width, STRATEGY_WINDOW_WIDTH),
    viewport.width - STRATEGY_WINDOW_MARGIN * 2
  );
  const height = Math.min(
    num(size && size.height, STRATEGY_WINDOW_HEIGHT),
    viewport.height - STRATEGY_WINDOW_MARGIN * 2
  );
  const maxX = Math.max(
    STRATEGY_WINDOW_MARGIN,
    viewport.width - width - STRATEGY_WINDOW_MARGIN
  );
  const maxY = Math.max(
    STRATEGY_WINDOW_MARGIN,
    viewport.height - height - STRATEGY_WINDOW_MARGIN
  );
  return {
    x: Math.max(STRATEGY_WINDOW_MARGIN, Math.min(num(pos.x, 0), maxX)),
    y: Math.max(STRATEGY_WINDOW_MARGIN, Math.min(num(pos.y, 0), maxY)),
  };
}

// A window never grows past the viewport and never shrinks below the size at
// which the header buttons still fit.
export function clampWindowSize(size, viewport) {
  return {
    width: Math.max(
      STRATEGY_WINDOW_MIN_WIDTH,
      Math.min(
        num(size && size.width, STRATEGY_WINDOW_WIDTH),
        Math.max(
          STRATEGY_WINDOW_MIN_WIDTH,
          viewport.width - STRATEGY_WINDOW_MARGIN * 2
        )
      )
    ),
    height: Math.max(
      STRATEGY_WINDOW_MIN_HEIGHT,
      Math.min(
        num(size && size.height, STRATEGY_WINDOW_HEIGHT),
        Math.max(
          STRATEGY_WINDOW_MIN_HEIGHT,
          viewport.height - STRATEGY_WINDOW_MARGIN * 2
        )
      )
    ),
  };
}

// New windows land in a cascade from the top-left of the viewport instead of
// all on top of each other.
export function cascadePos(index, viewport, size) {
  const step = 28;
  const slot = Math.max(0, num(index, 0)) % 8;
  return clampWindowPos(
    { x: 48 + slot * step, y: 64 + slot * step },
    size,
    viewport
  );
}

export function defaultWindowSize(viewport) {
  return clampWindowSize(
    { width: STRATEGY_WINDOW_WIDTH, height: STRATEGY_WINDOW_HEIGHT },
    {
      width: Math.max(STRATEGY_WINDOW_MIN_WIDTH, viewport.width - 32),
      height: Math.max(STRATEGY_WINDOW_MIN_HEIGHT, viewport.height - 96),
    }
  );
}

// The stack is stored bottom-to-top: the last entry is the window drawn on top
// and the one a click on it brings forward. `seq` is the creation order and is
// what the layer renders by; raising a window changes its place in the stack,
// not in the DOM, so the click that raised it still lands on the thing that was
// clicked.
export function bringToFront(windows, id) {
  const list = Array.isArray(windows) ? windows.slice() : [];
  const index = list.findIndex((w) => w && w.id === id);
  if (index === -1 || index === list.length - 1) return list;
  const [win] = list.splice(index, 1);
  list.push(win);
  return list;
}

// Stack position of a window (0 = bottom), which drives its z-index.
export function stackRank(windows, id) {
  const list = Array.isArray(windows) ? windows : [];
  return Math.max(0, list.findIndex((w) => w && w.id === id));
}

// Windows in a stable render order (creation order), whatever the stack order.
export function renderOrder(windows) {
  return (Array.isArray(windows) ? windows.slice() : []).sort(
    (a, b) => num(a.seq, 0) - num(b.seq, 0)
  );
}

// Opens a window for a setup, or brings the existing one forward: two windows
// showing the same guide would only fight over the vote state.
export function openWindow(windows, setupId, viewport, options = {}) {
  const list = Array.isArray(windows) ? windows.slice() : [];
  if (!setupId) return { windows: list, id: null, opened: false, focused: false };

  const existing = list.find((w) => w && w.setupId === setupId);
  if (existing) {
    return {
      windows: bringToFront(list, existing.id),
      id: existing.id,
      opened: false,
      focused: true,
    };
  }

  const size = defaultWindowSize(viewport);
  const pos = cascadePos(list.length, viewport, size);
  const win = {
    id: nextId(),
    seq: nextSeq(list),
    setupId,
    title: options.title || "",
    ...pos,
    ...size,
    collapsed: false,
  };

  return {
    windows: list.concat(win),
    id: win.id,
    opened: true,
    focused: false,
  };
}

function normalize(raw, viewport, fallbackSeq) {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.setupId !== "string" || !raw.setupId) return null;

  const size = clampWindowSize(
    { width: raw.width, height: raw.height },
    viewport
  );
  const pos = clampWindowPos({ x: raw.x, y: raw.y }, size, viewport);

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : nextId(),
    seq: num(raw.seq, fallbackSeq),
    setupId: raw.setupId,
    title: typeof raw.title === "string" ? raw.title : "",
    x: pos.x,
    y: pos.y,
    width: size.width,
    height: size.height,
    collapsed: !!raw.collapsed,
  };
}

// Restores the open windows after a page change or reload, dropping anything
// unreadable and anything that is no longer on screen.
export function loadStrategyWindows(storage, viewport = viewportSize()) {
  try {
    const raw = storage && storage.getItem(STRATEGY_WINDOWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed && parsed.windows;
    if (!Array.isArray(list)) return [];

    const seen = new Set();
    const windows = [];
    for (const entry of list) {
      const win = normalize(entry, viewport, windows.length + 1);
      if (!win || seen.has(win.setupId)) continue;
      seen.add(win.setupId);
      windows.push(win);
    }
    return windows;
  } catch (e) {
    return [];
  }
}

export function saveStrategyWindows(storage, windows) {
  try {
    if (!storage) return;
    const list = (Array.isArray(windows) ? windows : [])
      .filter((w) => w && w.setupId)
      .map((w) => ({
        id: w.id,
        seq: num(w.seq, 0),
        setupId: w.setupId,
        title: w.title || "",
        x: num(w.x, 0),
        y: num(w.y, 0),
        width: num(w.width, STRATEGY_WINDOW_WIDTH),
        height: num(w.height, STRATEGY_WINDOW_HEIGHT),
        collapsed: !!w.collapsed,
      }));
    if (!list.length) {
      storage.removeItem(STRATEGY_WINDOWS_STORAGE_KEY);
      return;
    }
    storage.setItem(STRATEGY_WINDOWS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

// Header text: the setup's name when the caller knows it, otherwise the
// feature's own label.
export function windowTitle(win) {
  const title = win && typeof win.title === "string" ? win.title.trim() : "";
  return title || "Strategies";
}
