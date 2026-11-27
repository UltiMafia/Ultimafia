// Speech filters for the in-game transcript.
//
// `from` is a player or spectator picked from the roster, matched against the
// full display name. `contains` is a case-insensitive substring of the message
// text. An empty value leaves that dimension unfiltered.
//
// Kept free of React so test/speechFilters.test.mjs can exercise the matching
// directly; TextMeetingLayout and the virtualized transcript both consume the
// same filtered array.

export function normalizeSpeechFilters(filters) {
  return {
    from: typeof filters?.from === "string" ? filters.from.trim() : "",
    contains:
      typeof filters?.contains === "string" ? filters.contains.trim() : "",
  };
}

export function hasSpeechFilter(filters) {
  const { from, contains } = normalizeSpeechFilters(filters);
  return Boolean(from || contains);
}

// Ctrl+F (Cmd+F on macOS) opens the in-game speech filter panel. Used only by
// the active game session; elsewhere the browser's own find stays untouched.
export function isSpeechFilterShortcut(event) {
  if (!event) return false;
  if (event.altKey || event.shiftKey) return false;
  if (!event.ctrlKey && !event.metaKey) return false;
  return String(event.key || "").toLowerCase() === "f";
}

// Server rows are the game log (alerts, obituaries, winners), not speech, so a
// speech filter must never hide them.
function isSystemMessage(message) {
  return Boolean(
    message &&
      (message.senderId === "server" ||
        message.winners ||
        message.obituaries)
  );
}

// A quote row in a meeting is a pointer to the original message: it carries the
// quoter's sender id and no content of its own. Match the message the reader
// actually sees, not the pointer.
function resolveQuotedMessage(message, history) {
  if (!message || !message.isQuote) return null;

  const state = history?.states?.[message.fromState];
  const meeting = state?.meetings?.[message.fromMeetingId];
  return (
    meeting?.messages?.find((original) => original.id === message.messageId) ||
    null
  );
}

function transcriptMessageName(message, players, spectators) {
  if (!message || message.senderId === "server") return "";

  const sender = players?.[message.senderId] || spectators?.[message.senderId];
  return sender?.name || "";
}

function matchesSpeechFilters(message, name, filters) {
  const { from, contains } = normalizeSpeechFilters(filters);

  if (from && name.toLowerCase() !== from.toLowerCase()) return false;

  if (contains) {
    const content = String(
      message?.content ?? message?.messageContent ?? ""
    ).toLowerCase();
    if (content.indexOf(contains.toLowerCase()) === -1) return false;
  }

  return true;
}

export function filterTranscriptMessages(
  messages,
  players,
  spectators,
  filters,
  history
) {
  if (!Array.isArray(messages)) return [];
  if (!hasSpeechFilter(filters)) return messages;

  return messages.filter((message) => {
    if (!message) return false;
    if (isSystemMessage(message)) return true;

    if (message.isQuote) {
      // An unresolved quote renders as nothing at all, so hiding it changes
      // nothing. Keep it; there is no author or text to judge.
      const original = resolveQuotedMessage(message, history);
      if (!original) return true;
      return matchesSpeechFilters(
        original,
        transcriptMessageName(original, players, spectators),
        filters
      );
    }

    return matchesSpeechFilters(
      message,
      transcriptMessageName(message, players, spectators),
      filters
    );
  });
}
