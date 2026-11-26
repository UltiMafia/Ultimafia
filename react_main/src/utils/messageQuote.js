// The state a chat message was sent in. Messages carry no state of their own
// (only the transcript view stamps one on), so look the message up in history
// by its meeting and id. Falls back to the message's own stamp, then to the
// state on screen.
export function findMessageState(history, message, fallbackState) {
  const states = history?.states;
  if (states && message?.id != null && message.meetingId != null) {
    for (const state of Object.keys(states)) {
      const meeting = states[state]?.meetings?.[message.meetingId];
      if (meeting?.messages?.some((m) => m.id === message.id)) return state;
    }
  }
  if (message?.fromState != null && message.fromState !== "")
    return message.fromState;
  return fallbackState;
}

export function canQuoteMessage(message, { review } = {}) {
  return Boolean(message && !review && message.senderId !== "server" &&
    message.senderId !== "vote" && !message.isQuote && message.quotable &&
    message.id != null && message.meetingId != null);
}

export function quoteReference(message, toMeetingId, fromState) {
  return {
    messageId: message.id,
    toMeetingId,
    fromMeetingId: message.meetingId,
    fromState,
  };
}

// Both actions use the same rule for source eligibility.
export function buildQuotePayload(message, { review, toMeetingId, history, stateViewing }) {
  if (!canQuoteMessage(message, { review })) return null;
  return quoteReference(message, toMeetingId, findMessageState(history, message, stateViewing));
}
