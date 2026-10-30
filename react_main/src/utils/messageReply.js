// Replies: a quote of the target message, then the typed text, sent to the
// server as one "reply" event. The server posts them as a normal quote and a
// normal message marked with the quote's id.

// Whether a hovered chat row shows the pin button. This is the rule master
// uses; replying never changes it. Pinning is not
// offered in pregame (state -1) or on quotes.
export function showPinButton({ review, isQuote, isHovering, stateViewing }) {
  return Boolean(!review && !isQuote && isHovering && stateViewing >= 0);
}

// Whether a chat row can be replied to: the same rule as double-click quoting.
export function canReplyTo(message, { review, stateViewing } = {}) {
  return Boolean(
    message &&
      !review &&
      stateViewing >= -1 &&
      message.senderId !== "server" &&
      message.senderId !== "vote" &&
      !message.isQuote &&
      message.quotable &&
      message.id != null &&
      message.meetingId != null
  );
}

// Click to reply: a single click on a row starts a reply after this delay; a
// second click inside it (a double-click) cancels that and quotes instead.
export const REPLY_CLICK_DELAY_MS = 250;

// A press that moves the pointer further than this before it is released is
// a drag (usually selecting text), never a reply.
export const REPLY_CLICK_MOVE_PX = 4;

// Whether the pointer moved far enough between press and click to be a drag.
export function isDrag(down, event) {
  if (!down || !event || event.clientX == null || event.clientY == null)
    return false;
  return (
    Math.hypot(event.clientX - down.x, event.clientY - down.y) >
    REPLY_CLICK_MOVE_PX
  );
}

// The game page sends typing to the chat box when nothing else has focus.
// Only keys that type do that: Tab, Enter, arrows, Escape and shortcuts
// (Ctrl+C on selected chat text) keep their usual meaning, so keyboard
// users can Tab to a message and press Enter to reply to it.
export function isTypingKey(e) {
  if (!e || e.ctrlKey || e.metaKey || e.altKey) return false;
  return (
    (typeof e.key === "string" && e.key.length === 1) || e.key === "Backspace"
  );
}

// The game page's window keydown handler: a typing key pressed while focus
// is outside any text field moves focus to the chat box (#speechInput).
export function redirectTypingToChat(e, doc = document) {
  if (!isTypingKey(e)) return;
  const speechInput = doc.getElementById("speechInput");
  const active = doc.activeElement && doc.activeElement.tagName;
  if (speechInput && active !== "INPUT" && active !== "TEXTAREA")
    speechInput.focus();
}

// Parts of a row that do something of their own when clicked (links, names
// and avatars, emotes and stickers, role mentions, the pin, the reply
// reference). A click on one of them never starts a reply. Spoilers and
// anything else that shows its own pointer cursor count too (see
// isReplyClick).
export const REPLY_CLICK_IGNORE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "img",
  "video",
  "audio",
  "[role='button']",
  "[role='link']",
  "[aria-haspopup]",
  "[contenteditable='true']",
  "[contenteditable='']",
  ".name-with-avatar",
  ".avatar",
  ".user-name",
  ".emote",
  ".sticker",
  ".role",
  ".pin-button-wrapper",
  ".reply-reference",
].join(", ");

// Whether some text inside `row` is selected (a drag or a word picked out
// to copy), so the click that ended it is not a reply.
export function hasSelectionIn(row, selection) {
  if (!row || !selection || selection.isCollapsed) return false;
  if (!String(selection).trim()) return false;
  return Boolean(
    (selection.anchorNode && row.contains(selection.anchorNode)) ||
      (selection.focusNode && row.contains(selection.focusNode)) ||
      (selection.containsNode && selection.containsNode(row, true))
  );
}

// Whether `el` shows a pointer cursor its parent does not: a clickable part
// of the row. A quotable line's own text has a pointer cursor too (it can be
// double-clicked), so the row's content box itself does not count.
function introducesPointer(el, row, getComputedStyle) {
  if (!getComputedStyle) return false;
  if (el.classList && el.classList.contains("content")) return false;
  if (getComputedStyle(el).cursor !== "pointer") return false;
  const parent = el.parentElement;
  return !parent || parent === row || getComputedStyle(parent).cursor !== "pointer";
}

// Whether a click on chat row `row` should start a reply. Only a plain,
// first, left click on the row's own text or empty space counts: not a
// second click of a double-click, not a click with a modifier, not one that
// selected text, not one on anything clickable inside the row, and not one
// from a popover that React bubbles up from outside the row, and not the end
// of a drag (env.pointerDown is where the press started).
export function isReplyClick(event, row, env = {}) {
  if (!event || !row) return false;
  if (isDrag(env.pointerDown, event)) return false;
  if (event.button != null && event.button !== 0) return false;
  if (event.detail > 1) return false;
  if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey)
    return false;
  const target = event.target;
  if (!target || !row.contains(target)) return false;
  if (hasSelectionIn(row, env.selection)) return false;
  for (let el = target; el && el !== row; el = el.parentElement) {
    if (el.matches && el.matches(REPLY_CLICK_IGNORE_SELECTOR)) return false;
    if (el.style && el.style.cursor === "pointer") return false;
    if (introducesPointer(el, row, env.getComputedStyle)) return false;
  }
  return true;
}

// The target to keep while the user types: the message plus the state it was
// shown in (messages carry no state of their own).
export function makeReplyTarget(message, stateViewing) {
  return {
    message,
    fromState:
      message.fromState != null && message.fromState !== ""
        ? message.fromState
        : stateViewing,
  };
}

// The "reply" socket payload, or null when this send is not a reply
// (no target, empty text, a command, or a speech ability like a whisper).
export function buildReplyPayload(target, { meetingId, content, abilityName }) {
  if (!target || !meetingId || !content) return null;
  if (abilityName) return null;
  if (content[0] === "/" && content.slice(0, 4) !== "/me ") return null;

  const { message, fromState } = target;
  return {
    quote: {
      messageId: message.id,
      toMeetingId: meetingId,
      fromMeetingId: message.meetingId,
      fromState,
      messageContent: message.content,
    },
    message: { content, meetingId },
  };
}

// Escape on the game page: with a reply pending it only cancels the reply
// (the leave dialog stays closed); otherwise it asks to leave, as before.
export function handleGameEscape(e, { replyPending, cancelReply, leave }) {
  if (e.key !== "Escape") return;
  if (replyPending) {
    e.preventDefault();
    cancelReply();
    return;
  }
  leave();
}

// Whether `message` is the reply that goes with the quote right above it:
// the server posts a reply as that quote, then this line with replyTo set to
// the quote's id, from the same sender in the same meeting.
export function isReplyToQuote(message, quote) {
  return Boolean(
    message &&
      quote &&
      quote.isQuote &&
      !message.isQuote &&
      message.replyTo != null &&
      quote.id != null &&
      message.replyTo === quote.id &&
      message.senderId === quote.senderId &&
      (message.meetingId == null ||
        quote.meetingId == null ||
        message.meetingId === quote.meetingId)
  );
}

// Chat rows to draw. A reply whose quote is directly above it becomes one row
// carrying that quote (`replyQuote`, `replyMerged`); the quote gets no row of
// its own. A reply whose quote is elsewhere in the list keeps its own row but
// still carries the quote (`replyMerged` false), so it can show what it
// answers. A quote whose reply has not arrived yet is drawn as before.
export function pairReplies(messages) {
  const quotesById = new Map();
  for (const m of messages) if (m && m.isQuote && m.id != null) quotesById.set(m.id, m);

  const rows = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const next = messages[i + 1];
    if (isReplyToQuote(next, message)) {
      rows.push({ message: next, replyQuote: message, replyMerged: true });
      i++;
      continue;
    }
    const quote =
      message && !message.isQuote && message.replyTo != null
        ? quotesById.get(message.replyTo)
        : undefined;
    if (quote && isReplyToQuote(message, quote))
      rows.push({ message, replyQuote: quote, replyMerged: false });
    else rows.push({ message });
  }
  return rows;
}

// What a reply shows about the line it answers: the same lookup a quote row
// does (anonymous senders stay "Anonymous", with no player to draw). Null
// when it cannot be found.
export function describeQuotedMessage(quote, state, players, spectators) {
  if (!quote || !state) return null;
  const meeting = state.meetings?.[quote.fromMeetingId];
  if (!meeting) return null;
  const msg = (meeting.messages || []).find((m) => m.id === quote.messageId);
  if (!msg) return null;
  const anonymous = msg.senderId === "anonymous";
  const sender = anonymous
    ? undefined
    : players?.[msg.senderId] || spectators?.[msg.senderId];
  return {
    messageId: msg.id,
    senderName: sender ? sender.name : "Anonymous",
    sender,
    nameColor: sender ? msg.nameColor : undefined,
    fromStateName: state.name,
    meetingName: meeting.name,
    content: msg.content,
    time: msg.time,
    customEmotes: msg.customEmotes,
    customStickers: msg.customStickers,
  };
}

// The original line's chat row, if it is on screen in the same chat as the
// reply's row. Used to jump to it from the reply.
export function findMessageRow(fromRow, messageId) {
  if (!fromRow || messageId == null) return null;
  const chat = fromRow.closest(".speech-display") || fromRow.parentElement;
  if (!chat) return null;
  for (const row of chat.querySelectorAll(".message[data-message-id]"))
    if (row.dataset.messageId === String(messageId)) return row;
  return null;
}
