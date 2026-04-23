// 100% copy-pasted from ../../../shared/scrapbook.js (backend) with courage.
// Both sides take the roles map as input (backend: data/roles.js, frontend: siteInfo.rolesRaw)
// so the single source of truth for role data stays in data/roles.js.

export function isCountableScrapbookRole(rolesMap, gameType, role) {
  const data = rolesMap?.[gameType]?.[role];
  if (!data) return false;
  return data.alignment !== "Event";
}

export function getTotalObtainableStamps(rolesMap) {
  return Object.values(rolesMap?.Mafia || {}).filter(
    (role) => role?.alignment !== "Event"
  ).length;
}
