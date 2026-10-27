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
  otherMembers,
  dmTitle,
  isGroupDm,
  dmPreviewText,
  formatDmTime,
  sortDirects,
  groupMessages,
  sendErrorText,
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
  const empty = { open: false, collapsed: false, pos: null, channelId: null };
  assert.deepEqual(loadDmWindowState(st), empty);
  saveDmWindowState(st, { open: true, collapsed: true, pos: { x: 10, y: 20 }, channelId: md5 });
  assert.deepEqual(loadDmWindowState(st), { open: true, collapsed: true, pos: { x: 10, y: 20 }, channelId: md5 });
  // Only DM ids are kept as the open conversation.
  saveDmWindowState(st, { open: true, collapsed: false, pos: null, channelId: "lobbyRoom1" });
  assert.equal(loadDmWindowState(st).channelId, null);
  st.m.set(DM_WINDOW_STORAGE_KEY, "{bad json");
  assert.deepEqual(loadDmWindowState(st), empty);
  assert.deepEqual(loadDmWindowState(null), empty);
});

test("position is clamped so the title bar stays reachable", () => {
  const vp = { width: 1000, height: 800 };
  const size = { width: 360, height: 460 };
  assert.deepEqual(clampDmPos({ x: -50, y: -50 }, size, vp), { x: 4, y: 4 });
  assert.deepEqual(clampDmPos({ x: 5000, y: 5000 }, size, vp), { x: 636, y: 744 });
  assert.deepEqual(clampDmPos({ x: 100, y: 100 }, size, vp), { x: 100, y: 100 });
});

const me = { id: "me", name: "Me" };
const alice = { id: "a", name: "Alice" };
const bob = { id: "b", name: "Bob" };
const carl = { id: "c", name: "Carl" };

test("conversation names are the other members", () => {
  assert.equal(dmTitle({ members: [me, alice] }, "me"), "Alice");
  assert.equal(dmTitle({ members: [me, alice, bob] }, "me"), "Alice and Bob");
  assert.equal(dmTitle({ members: [me, alice, bob, carl] }, "me"), "Alice, Bob and Carl");
  assert.equal(dmTitle({ members: [me] }, "me"), "Me");
  assert.deepEqual(otherMembers({ members: [me, alice] }, "me"), [alice]);
  assert.equal(isGroupDm({ members: [me, alice] }), false);
  assert.equal(isGroupDm({ members: [me, alice, bob] }), true);
});

test("previews say who wrote the last message", () => {
  const one = { members: [me, alice] };
  const group = { members: [me, alice, bob] };
  assert.equal(dmPreviewText({ ...one, lastMessage: null }, "me"), "");
  assert.equal(dmPreviewText({ ...one, lastMessage: { content: "hi\n there", senderId: "a" } }, "me"), "hi there");
  assert.equal(dmPreviewText({ ...one, lastMessage: { content: "yo", senderId: "me" } }, "me"), "You: yo");
  assert.equal(dmPreviewText({ ...group, lastMessage: { content: "hey all", senderId: "b" } }, "me"), "Bob: hey all");
});

test("times are short, X style", () => {
  const now = new Date(2026, 9, 26, 21, 0, 0).getTime();
  assert.equal(formatDmTime(now - 10 * 1000, now), "now");
  assert.equal(formatDmTime(now - 5 * 60 * 1000, now), "5m");
  assert.equal(formatDmTime(now - 3 * 3600 * 1000, now), "3h");
  assert.equal(formatDmTime(now - 2 * 86400 * 1000, now), "2d");
  assert.equal(formatDmTime(new Date(2026, 9, 12).getTime(), now), "Oct 12");
  assert.equal(formatDmTime(new Date(2025, 0, 3).getTime(), now), "Jan 3, 2025");
  assert.equal(formatDmTime(0, now), "");
});

test("conversations sort newest first with no duplicates", () => {
  const list = sortDirects([
    { id: "x", lastMessageDate: 10 },
    { id: "y", lastMessageDate: 5, lastMessage: { date: 30 } },
    { id: "x", lastMessageDate: 99 },
    { id: "z", lastMessageDate: 20 },
  ]);
  assert.deepEqual(list.map((c) => c.id), ["y", "z", "x"]);
});

test("messages group by sender within 5 minutes", () => {
  const m = (id, sender, date) => ({ id, sender: { id: sender }, date });
  const groups = groupMessages([m(1, "a", 0), m(2, "a", 1000), m(3, "me", 2000), m(4, "me", 2000 + 6 * 60 * 1000)]);
  assert.deepEqual(groups.map((g) => g.messages.map((x) => x.id)), [[1, 2], [3], [4]]);
});

test("rate-limit errors read as 'slow down'", () => {
  assert.match(sendErrorText("You are chatting too quickly."), /Slow down/);
  assert.equal(sendErrorText("A user in this channel is only accepting DMs from friends."), "A user in this channel is only accepting DMs from friends.");
});
