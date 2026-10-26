// Replies: a quote of the target message, then the typed text, sent to the
// server as one "reply" event. The server posts them as a normal quote and a
// normal message marked with the quote's id.

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
