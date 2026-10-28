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

// Payload for the "quote" socket event, or null when the message cannot be
// quoted (server lines, quotes, unquotable messages, game review).
export function buildQuotePayload(message, { review, toMeetingId, history, stateViewing }) {
  if (
    review ||
    !message ||
    message.senderId === "server" ||
    message.isQuote ||
    !message.quotable
  ) {
    return null;
  }
  return {
    messageId: message.id,
    toMeetingId,
    fromMeetingId: message.meetingId,
    fromState: findMessageState(history, message, stateViewing),
    messageContent: message.content,
  };
}
