const path = require("path");
const fs = require("fs");
const roleIdentity = require("./roleIdentity");
const itemData = require("../data/items");

function itemClassExists(gameType, itemName) {
  // Match Utils.importGameClass's space removal and PascalCase behavior without
  // requiring the item module (which can execute constructor-time code).
  if (typeof itemName !== "string" || !/^[A-Za-z][A-Za-z0-9]*$/.test(itemName)) return false;
  const gameDirectory = gameType.replace(/ /g, "");
  const className = itemName;
  const classPath = path.join(__dirname, "..", "Games", "types", gameDirectory, "items", `${className}.js`);
  return fs.existsSync(classPath);
}

function validateItem(item, gameType) {
  const gameItems = itemData[gameType];
  const itemName = typeof item === "string" ? item : item.type;
  if (!gameItems || !Object.prototype.hasOwnProperty.call(itemData, gameType)) {
    throw new TypeError(`Unknown custom item type: ${itemName}`);
  }

  let internal;
  if (Object.prototype.hasOwnProperty.call(gameItems, itemName)) {
    const definition = gameItems[itemName];
    internal = Array.isArray(definition.internal) ? definition.internal[0] : undefined;
  } else {
    const definition = Object.values(gameItems).find((candidate) =>
      Array.isArray(candidate.internal) && candidate.internal.includes(itemName)
    );
    if (definition) internal = itemName;
  }
  if (!internal || !itemClassExists(gameType, internal)) {
    throw new TypeError(`Unknown custom item type: ${itemName}`);
  }
  return typeof item === "string" ? internal : { type: internal, args: item.args };
}

/** Convert either legacy role maps or descriptor groups to validator maps. */
function toValidatorRoleMaps(value, gameType) {
  const groups = roleIdentity.toRoleGroups(value);
  if (gameType) {
    for (const group of groups) {
      for (const entry of group) {
        const items = entry.role.items.map((item) => validateItem(item, gameType));
        entry.role = roleIdentity.roleWith(entry.role, { items });
      }
    }
  }
  // Public labels can converge on the same internal item identity. Merge after
  // canonicalization so an alias never overwrites another entry's count.
  return roleIdentity.toRoleMaps(groups);
}

/** Persist Setup.roles as descriptor-entry arrays, never identity-encoded keys. */
function serializeSetupRoles(value) {
  return roleIdentity.serializeRoleGroups(value);
}

/** Public setup APIs retain the old JSON array-of-count-maps wire format. */
function setupRolesForApi(value) {
  return roleIdentity.serializeRoleMaps(value);
}

function gameHistoryForApi(value) {
  if (typeof value !== "string") return value;
  try {
    const history = JSON.parse(value);
    if (history.originalRoles && typeof history.originalRoles === "object") {
      for (const [playerId, role] of Object.entries(history.originalRoles)) {
        if (role && typeof role === "object") {
          history.originalRoles[playerId] = roleIdentity.roleKey(role);
        }
      }
    }
    return JSON.stringify(history);
  } catch (error) {
    return value;
  }
}

module.exports = {
  toValidatorRoleMaps,
  serializeSetupRoles,
  setupRolesForApi,
  gameHistoryForApi,
};
