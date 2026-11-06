// Draft bookkeeping for optimistic speech lines.
//
// When a line is refused (speakCooldown) or never confirmed, the client wants
// to hand the text back. It must not do that when the player has already
// started the next line: the refusal of line N can arrive while line N+1 is
// half-typed, and restoring N over it would erase what they wrote.
export function draftAfterRestore(current, dismissed) {
  if (current) return current;
  return dismissed || "";
}

// Whether a message from the server confirms the pending row we are tracking.
// Matching is by meeting and trimmed text, the same rule the optimistic row
// itself is matched with.
export function confirmsPending(entry, message) {
  if (!entry || !message) return false;
  // A caller that already scoped to one meeting may pass a message without
  // the field; anything that does carry it must agree.
  if (message.meetingId && entry.meetingId !== message.meetingId) return false;

  return (
    String(entry.content || "").trim() === String(message.content || "").trim()
  );
}
