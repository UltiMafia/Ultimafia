// Replies: a quote of the target message, then the typed text, sent to the
// server as one "reply" event. The server posts them as a normal quote and a
// normal message marked with the quote's id.

// Whether a hovered chat row shows the pin button. This is the rule master
// uses; the reply button sits under it and never changes it. Pinning is not
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
// carrying that quote (`replyQuote`); the quote gets no row of its own. A
// quote whose reply has not arrived yet, and a reply whose quote is not
// directly above it, are drawn as before.
export function pairReplies(messages) {
  const rows = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const next = messages[i + 1];
    if (isReplyToQuote(next, message)) {
      rows.push({ message: next, replyQuote: message });
      i++;
    } else {
      rows.push({ message });
    }
  }
  return rows;
}

// What the reply preview shows about the quoted line: the same lookup a quote
// row does (anonymous senders stay "Anonymous"). Null when it cannot be found.
export function describeQuotedMessage(quote, state, players, spectators) {
  if (!quote || !state) return null;
  const meeting = state.meetings?.[quote.fromMeetingId];
  if (!meeting) return null;
  const msg = (meeting.messages || []).find((m) => m.id === quote.messageId);
  if (!msg) return null;
  const sender = players?.[msg.senderId] || spectators?.[msg.senderId];
  return {
    senderName:
      sender && msg.senderId !== "anonymous" ? sender.name : "Anonymous",
    fromStateName: state.name,
    meetingName: meeting.name,
    content: msg.content,
    time: msg.time,
    customEmotes: msg.customEmotes,
    customStickers: msg.customStickers,
  };
}
