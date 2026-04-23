// 100% copy-pasted from ./shared (backend) with courage.
// Backend passes data/roles.js; frontend passes siteInfo.rolesRaw.

export const isCountableScrapbookRole = (rolesMap, gameType, role) => {
  const data = rolesMap?.[gameType]?.[role];
  if (!data) return false;
  return data.alignment !== "Event";
};

export const getTotalObtainableStamps = (rolesMap) => {
  return Object.values(rolesMap?.Mafia || {}).filter(
    (role) => role?.alignment !== "Event"
  ).length;
};
