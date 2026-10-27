import test from "node:test";
import assert from "node:assert/strict";
import {
  isGamePath,
  isDirectChannelId,
  countUnreadDmChannels,
  dmButtonState,
  loadDmWindowState,
  saveDmWindowState,
  clampDmPos,
  DM_WINDOW_STORAGE_KEY,
} from "../src/utils/dmWindow.js";

const md5 = "0123456789abcdef0123456789abcdef";

test("window is hidden on game pages only", () => {
  assert.equal(isGamePath("/game/abc123"), true);
  assert.equal(isGamePath("/game"), true);
  assert.equal(isGamePath("/play"), false);
  assert.equal(isGamePath("/user/notifications"), false);
  assert.equal(isGamePath("/gamers"), false);
});

test("only 32-char ids are DM channels", () => {
  assert.equal(isDirectChannelId(md5), true);
  assert.equal(isDirectChannelId("lobbyRoom1"), false);
  assert.equal(isDirectChannelId(undefined), false);
});

test("unread badge counts DM conversations with unread, not rooms", () => {
  assert.equal(countUnreadDmChannels({}), 0);
  assert.equal(countUnreadDmChannels({ [md5]: 3, room1: 5 }), 1);
  assert.equal(countUnreadDmChannels({ [md5]: 0 }), 0);
  assert.equal(
    countUnreadDmChannels({ [md5]: 1, ["f".repeat(32)]: 2 }),
    2
  );
});

test("button is disabled with the server's reason while locked", () => {
  assert.deepEqual(dmButtonState({ locked: false }), { disabled: false, tooltip: "Direct messages" });
  assert.deepEqual(dmButtonState(null), { disabled: false, tooltip: "Direct messages" });
  const s = dmButtonState({ locked: true, message: "Locked in game" });
  assert.equal(s.disabled, true);
  assert.equal(s.tooltip, "Locked in game");
  assert.match(dmButtonState({ locked: true }).tooltip, /ranked or competitive/);
});

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
}

test("window state round-trips through storage", () => {
  const st = memStorage();
  assert.deepEqual(loadDmWindowState(st), { open: false, collapsed: false, pos: null });
  saveDmWindowState(st, { open: true, collapsed: true, pos: { x: 10, y: 20 } });
  assert.deepEqual(loadDmWindowState(st), { open: true, collapsed: true, pos: { x: 10, y: 20 } });
  st.m.set(DM_WINDOW_STORAGE_KEY, "{bad json");
  assert.deepEqual(loadDmWindowState(st), { open: false, collapsed: false, pos: null });
  assert.deepEqual(loadDmWindowState(null), { open: false, collapsed: false, pos: null });
});

test("position is clamped so the title bar stays reachable", () => {
  const vp = { width: 1000, height: 800 };
  const size = { width: 360, height: 460 };
  assert.deepEqual(clampDmPos({ x: -50, y: -50 }, size, vp), { x: 4, y: 4 });
  assert.deepEqual(clampDmPos({ x: 5000, y: 5000 }, size, vp), { x: 636, y: 752 });
  assert.deepEqual(clampDmPos({ x: 100, y: 100 }, size, vp), { x: 100, y: 100 });
});
