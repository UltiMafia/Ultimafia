// The game types ring a bell (Mafia) or a ping on each new game state. The
// server also re-sends the current state to a client whose seat changes
// (Spectate, Join open seat, a failed ready check moving them, reconnects),
// and those re-sends used to ring too, so a pregame lobby rang at random.
// Ring only when the state id actually changes. Shared with the server-side
// test suite.

// lastId: the state id last seen (null before any). Returns whether to ring
// and the id to remember.
function nextStateBell(lastId, state) {
  const id = state && state.id;
  if (id === undefined || id === null) return { ring: false, lastId };
  const known = lastId !== undefined && lastId !== null;
  return { ring: known && String(id) !== String(lastId), lastId: id };
}

module.exports = { nextStateBell };
