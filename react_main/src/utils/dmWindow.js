// Plain helpers for the floating DM window (components/dms). Kept free of
// React so they can be unit tested with node --test.

export const DM_WINDOW_STORAGE_KEY = "dmWindow";
export const DM_WINDOW_WIDTH = 360;
export const DM_WINDOW_HEIGHT = 468;
export const DM_TITLE_BAR_HEIGHT = 52;

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

// channelId: the conversation open in the window (null = conversation list).
export const DEFAULT_DM_WINDOW_STATE = {
  open: false,
  collapsed: false,
  pos: null,
  channelId: null,
};

export function loadDmWindowState(storage) {
  try {
    const raw = storage && storage.getItem(DM_WINDOW_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DM_WINDOW_STATE };
    const s = JSON.parse(raw);
    const pos =
      s && s.pos && Number.isFinite(s.pos.x) && Number.isFinite(s.pos.y)
        ? { x: s.pos.x, y: s.pos.y }
        : null;
    const channelId =
      s && isDirectChannelId(s.channelId) ? s.channelId : null;
    return { open: !!(s && s.open), collapsed: !!(s && s.collapsed), pos, channelId };
  } catch (e) {
    return { ...DEFAULT_DM_WINDOW_STATE };
  }
}

export function saveDmWindowState(storage, state) {
  try {
    storage &&
      storage.setItem(
        DM_WINDOW_STORAGE_KEY,
        JSON.stringify({
          open: !!state.open,
          collapsed: !!state.collapsed,
          pos: state.pos || null,
          channelId: isDirectChannelId(state.channelId) ? state.channelId : null,
        })
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

// ---- Conversation list (X Chat style) ----

// Everyone in the DM but me. A DM with only me in it lists me.
export function otherMembers(channel, selfId) {
  const members = (channel && channel.members) || [];
  const others = members.filter((m) => m && m.id !== selfId);
  return others.length ? others : members.slice(0, 1);
}

// "Alice", or "Alice, Bob and Carl" style for groups.
export function dmTitle(channel, selfId) {
  const names = otherMembers(channel, selfId).map((m) => m.name);
  if (names.length <= 1) return names[0] || "Conversation";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function isGroupDm(channel) {
  return ((channel && channel.members) || []).length > 2;
}

// One-line preview of the last message: "You: hi", "Bob: hi" in groups,
// plain "hi" from the other person in a 1:1.
export function dmPreviewText(channel, selfId) {
  const last = channel && channel.lastMessage;
  if (!last || last.content == null) return "";
  const content = String(last.content).replace(/\s+/g, " ").trim();
  if (last.senderId === selfId) return `You: ${content}`;
  if (isGroupDm(channel)) {
    const sender = ((channel && channel.members) || []).find(
      (m) => m.id === last.senderId
    );
    if (sender) return `${sender.name}: ${content}`;
  }
  return content;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// X-style short time: "now", "5m", "3h", "2d", then "Oct 12" ("Oct 12, 2025"
// for another year).
export function formatDmTime(date, now = Date.now()) {
  if (!date) return "";
  const diff = Math.max(0, now - date);
  const min = 60 * 1000;
  if (diff < min) return "now";
  if (diff < 60 * min) return `${Math.floor(diff / min)}m`;
  if (diff < 24 * 60 * min) return `${Math.floor(diff / (60 * min))}h`;
  if (diff < 7 * 24 * 60 * min) return `${Math.floor(diff / (24 * 60 * min))}d`;
  const d = new Date(date);
  const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === new Date(now).getFullYear()
    ? label
    : `${label}, ${d.getFullYear()}`;
}

function lastActivity(channel) {
  return Math.max(
    Number(channel && channel.lastMessageDate) || 0,
    Number(channel && channel.lastMessage && channel.lastMessage.date) || 0
  );
}

// Most recent first, one entry per channel id.
export function sortDirects(directs) {
  const seen = new Set();
  return (directs || [])
    .filter((c) => c && c.id && !seen.has(c.id) && seen.add(c.id))
    .sort((a, b) => lastActivity(b) - lastActivity(a));
}

// Bubble groups: consecutive messages from one sender within 5 minutes.
export function groupMessages(messages, gapMs = 5 * 60 * 1000) {
  const groups = [];
  for (const m of messages || []) {
    const last = groups[groups.length - 1];
    const prev = last && last.messages[last.messages.length - 1];
    if (last && last.senderId === m.sender.id && m.date - prev.date <= gapMs)
      last.messages.push(m);
    else groups.push({ senderId: m.sender.id, sender: m.sender, messages: [m] });
  }
  return groups;
}

// Friendlier text for errors the chat server sends after a message.
export function sendErrorText(error) {
  const text = typeof error === "string" ? error : (error && error.message) || "";
  if (/too quickly/i.test(text))
    return "Slow down! That message wasn't sent. Press Enter to try again.";
  return text || "That message wasn't sent.";
}
