// Optimistic rows are always the tail of a meeting's message list. A message
// that arrives while one is still waiting was accepted first — the socket
// delivers in the order the server accepted messages — so it belongs *before*
// the waiting row. Appending it would put the confirmed line above one that
// came earlier and leave this client's transcript different from everyone
// else's.
export function insertBeforePending(messages, message) {
  const list = Array.isArray(messages) ? messages : [];

  let at = list.length;
  while (at > 0 && list[at - 1] && list[at - 1].pending) at -= 1;

  const next = list.slice();
  next.splice(at, 0, message);
  return next;
}

// The server echo replaces the optimistic row it confirms, in place, so the
// line does not jump to the end. The row is identified by sender and trimmed
// content: the echo carries the server's id, not the local one.
export function replacePending(messages, message) {
  const list = Array.isArray(messages) ? messages : [];
  const wanted = String((message && message.content) || "").trim();
  const at = list.findIndex(
    (m) =>
      m &&
      m.pending &&
      m.senderId === message.senderId &&
      String(m.content || "").trim() === wanted
  );
  if (at === -1) return null;

  const next = list.slice();
  next[at] = message;
  return next;
}

// A rejected or abandoned send takes its row back out of every state it was
// stored in.
export function removePending(messages, id) {
  const list = Array.isArray(messages) ? messages : [];
  const at = list.findIndex((m) => m && m.id === id);
  if (at === -1) return null;

  const next = list.slice();
  next.splice(at, 1);
  return next;
}
