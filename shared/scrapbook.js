// Single source of truth for scrapbook completion rules, imported by both
// the backend (modules/hallOfFame.js) and the frontend (components/Scrapbook.jsx).
// Both sides pass their own roles map — backend: data/roles.js, frontend: siteInfo.rolesRaw.

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
