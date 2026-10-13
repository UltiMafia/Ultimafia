process.env.NODE_ENV = process.env.NODE_ENV || "test";
const roleData = require("../data/roles");
const modifierData = require("../data/modifiers");
const constants = require("../data/constants");
const { isRoleDisabled } = require("./roleAvailability");

function areModifiersCompatible(gameType, modifiers) {
  if (!modifierData[gameType] || typeof modifiers !== "string") return false;
  const mappedModifiers = modifiers
    .split("/")
    .map((modifier) =>
      Object.entries(modifierData[gameType]).find(
        (mData) => mData[0] === modifier
      )
    );
  if (mappedModifiers.some((m) => !m)) return false;
  const incompatibles = mappedModifiers
    .map((e) => (e && e[1] && Array.isArray(e[1].incompatible) ? e[1].incompatible : []))
    .flat();
  const usedModifiers = [];
  for (const modifier of mappedModifiers) {
    if (
      incompatibles.includes(modifier[0]) ||
      (usedModifiers.includes(modifier[0]) && !modifier[1]?.allowDuplicate)
    ) {
      return false;
    }
    usedModifiers.push(modifier[0]);
  }
  return true;
}

function verifyRole(role, gameType, alignment) {
  var roleName = role.split(":")[0];
  var modifiers = role.split(":")[1];

  if (!roleData.hasOwnProperty(gameType)) return false;

  if (!roleData[gameType].hasOwnProperty(roleName)) return false;

  if (modifiers) {
    for (const modifier of modifiers.split("/")) {
      if (!constants.modifiers[gameType][modifier]) return false;
    }
    if (!areModifiersCompatible(gameType, modifiers)) {
      return false;
    }
  }

  if (isRoleDisabled(gameType, roleName, roleData[gameType][roleName]))
    return false;

  if (alignment && roleData[gameType][roleName].alignment != alignment)
    return false;

  return true;
}

module.exports = { verifyRole, areModifiersCompatible };
