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
