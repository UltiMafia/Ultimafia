// Shared by the rehost field backup and rollback scripts.
const FIELDS = ["originalRanked", "originalCompetitive", "lobbyNameCustom"];

function hasAnyField() {
  return { $or: FIELDS.map((f) => ({ [f]: { $exists: true } })) };
}

module.exports = { FIELDS, hasAnyField };
