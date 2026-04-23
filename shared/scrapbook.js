// 100% mirror of ./react_main/src/shared/scrapbook.js (frontend copy) — see shared/colors.js for the pattern.
// Both sides take the roles map as input (backend: data/roles.js, frontend: siteInfo.rolesRaw) so the
// single source of truth for role data stays in data/roles.js.

function isCountableScrapbookRole(rolesMap, gameType, role) {
  const data = rolesMap?.[gameType]?.[role];
  if (!data) return false;
  return data.alignment !== "Event";
}

function getTotalObtainableStamps(rolesMap) {
  return Object.values(rolesMap?.Mafia || {}).filter(
    (role) => role?.alignment !== "Event"
  ).length;
}

module.exports = {
  isCountableScrapbookRole,
  getTotalObtainableStamps,
};
