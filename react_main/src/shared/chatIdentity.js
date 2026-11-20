// Use only identities delivered to this viewer. Prefer a current name match,
// but keep historical entries addressable after someone leaves or changes seats.
function findChatIdentity(name, players, spectators) {
  const key = name.toLowerCase();
  let historical;
  for (const roster of [players, spectators]) {
    for (const person of Object.values(roster || {})) {
      if (person?.name?.toLowerCase() !== key) continue;
      if (!person.left && person.watching !== false) return person;
      historical ||= person;
    }
  }
  return historical;
}

module.exports = { findChatIdentity };
