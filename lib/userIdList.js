// Parses a comma-separated list of user ids from a server env value, e.g.
// "laJoqacXr, Or7_sztgH". Spaces around ids are trimmed and blank entries
// skipped; ids are matched exactly (case-sensitive). Returns a Set, or null
// when the value is unset or has no ids (only spaces and commas).
function parseUserIdList(value) {
  if (value == null) return null;
  const ids = String(value)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
}

module.exports = { parseUserIdList };
