const roleData = require("../data/roles");

/**
 * @param {string} input
 * @returns {string|null} Canonical Mafia role name
 */
function canonicalRoleName(input) {
  const mafia = roleData.Mafia;
  const t = String(input || "").trim();
  if (!t || !mafia) return null;
  if (mafia[t]) return t;
  const tl = t.toLowerCase();
  for (const name of Object.keys(mafia)) {
    if (name.toLowerCase() === tl) return name;
  }
  return null;
}

/**
 * @param {string} roleName
 * @param {string} skinRaw
 * @returns {string|null} Normalized skin (lowercase) or null if invalid
 */
function normalizeSkinForRole(roleName, skinRaw) {
  const skin = String(skinRaw || "").trim().toLowerCase();
  if (!skin) return null;
  const role = roleData.Mafia && roleData.Mafia[roleName];
  if (!role) return null;
  if (skin === "vivid") return skin;
  const skins = role.skins || [];
  if (skins.some((s) => s.value === skin)) return skin;
  return null;
}

function makeCreditKey(roleName, skin) {
  return `${roleName}:${skin}`;
}

module.exports = {
  canonicalRoleName,
  normalizeSkinForRole,
  makeCreditKey,
};
