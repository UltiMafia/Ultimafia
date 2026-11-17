// A message must never reach the transcript twice.
//
// The transcript is virtualized and keyed by message id, so a duplicated entry
// is not cosmetic: two items share a key, the window places both at the same
// offset for a frame, and every row below them moves when one disappears. That
// is the "spaces between messages grew after the first render" report.
//
// Duplicates can reach the list from more than one direction - a state's alerts
// or obituaries carried over into the next state, a message echoed by both the
// meeting and the spectator chat, a socket append racing a history fetch - so
// the list is normalised once, where it is assembled, rather than at each
// source.
//
// Identity is the message id when there is one. Server-authored rows (alerts,
// obituaries, the winners line) carry no id: those are deduplicated by object
// reference, which removes a message that was inserted twice while leaving two
// genuinely separate announcements with the same text alone.
function dedupeMessages(messages) {
  if (!Array.isArray(messages)) return messages;

  const seenIds = new Set();
  const seenObjects = new Set();
  const result = [];

  for (const message of messages) {
    if (!message) {
      result.push(message);
      continue;
    }
    if (message.id != null) {
      const id = String(message.id);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      result.push(message);
      continue;
    }
    if (typeof message === "object") {
      if (seenObjects.has(message)) continue;
      seenObjects.add(message);
    }
    result.push(message);
  }

  return result;
}

module.exports = { dedupeMessages };
