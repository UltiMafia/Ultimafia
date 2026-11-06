const oHash = require("object-hash");
const roleData = require("../data/roles");
const constants = require("../data/constants");

// A setup's roles are an array of rolesets. Each roleset is an array of
// slots. The legacy stored form was a JSON string of count maps
// ("Villager:Armed/Bulletproof" -> count). Slots keep that key available
// through formatRoleKey so assignment, stats, and the setup UI stay on it.
// `items` is the starting inventory. It is empty until that editor exists.

function isRoleSlot(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof value.name === "string" &&
      Array.isArray(value.modifiers)
  );
}

function parseRoleKey(key) {
  const text = String(key);
  const colon = text.indexOf(":");
  if (colon === -1) {
    return { name: text, modifiers: [], items: [] };
  }
  const name = text.slice(0, colon);
  const modPart = text.slice(colon + 1);
  const modifiers = modPart ? modPart.split("/").filter(Boolean) : [];
  return { name, modifiers, items: [] };
}

// No modifiers keep the trailing colon ("Villager:", "Host:"). That is the
// key the setup UI, host checks, and saved setups already use.
function formatRoleKey(slot) {
  const name = slot && slot.name ? String(slot.name) : "";
  const modifiers = (slot && slot.modifiers ? slot.modifiers : []).filter(Boolean);
  if (!modifiers.length) return `${name}:`;
  return `${name}:${modifiers.join("/")}`;
}

function slotCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function cloneSlot(slot) {
  const modifiers = Array.isArray(slot.modifiers)
    ? slot.modifiers.filter(Boolean).map(String)
    : [];
  const items = Array.isArray(slot.items)
    ? slot.items.filter((item) => typeof item === "string" && item).map(String)
    : [];
  return {
    name: String(slot.name),
    modifiers,
    items,
    count: slotCount(slot.count),
  };
}

function isLegacyRoleset(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "number");
}

function normalizeRoleset(roleset) {
  if (roleset == null) return [];
  if (Array.isArray(roleset)) {
    if (roleset.length === 0 || isRoleSlot(roleset[0])) {
      return roleset.filter(isRoleSlot).map(cloneSlot);
    }
    return [];
  }
  if (isLegacyRoleset(roleset)) {
    return Object.keys(roleset).map((key) => {
      const parsed = parseRoleKey(key);
      return cloneSlot({ ...parsed, count: roleset[key] });
    });
  }
  return [];
}

function normalizeRoles(roles) {
  if (roles == null || roles === "") return [];
  if (typeof roles === "string") {
    try {
      roles = JSON.parse(roles);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(roles)) {
    if (isLegacyRoleset(roles)) return [normalizeRoleset(roles)];
    return [];
  }
  return roles.map(normalizeRoleset);
}

function toCountMap(roleset) {
  const map = {};
  for (const slot of normalizeRoleset(roleset)) {
    const key = formatRoleKey(slot);
    map[key] = slotCount(map[key]) + slot.count;
  }
  return map;
}

function toCountMaps(roles) {
  return normalizeRoles(roles).map(toCountMap);
}

function roleCount(roleset, key) {
  if (!roleset) return undefined;
  return toCountMap(roleset)[key];
}

function compareRoleKeys(gameType, keyA, keyB) {
  const alignments = constants.alignments[gameType] || [];
  const nameA = parseRoleKey(keyA).name;
  const nameB = parseRoleKey(keyB).name;
  const data = roleData[gameType] || {};
  const alignA = data[nameA] && data[nameA].alignment;
  const alignB = data[nameB] && data[nameB].alignment;
  if (alignA != alignB) {
    return alignments.indexOf(alignA) - alignments.indexOf(alignB);
  }
  if (keyA < keyB) return -1;
  if (keyA > keyB) return 1;
  return 0;
}

function compareSlots(gameType, a, b) {
  const byRole = compareRoleKeys(gameType, formatRoleKey(a), formatRoleKey(b));
  if (byRole !== 0) return byRole;
  const itemsA = (a.items || []).join("\0");
  const itemsB = (b.items || []).join("\0");
  if (itemsA < itemsB) return -1;
  if (itemsA > itemsB) return 1;
  return 0;
}

function canonicalizeRoles(roles, gameType) {
  return normalizeRoles(roles).map((roleset) =>
    roleset.slice().sort((a, b) => compareSlots(gameType, a, b))
  );
}

// Copy starting items onto slots that were round-tripped through a count
// map. The current editor still speaks count maps, which have nowhere to
// put items. A later inventory step can send items on the slot itself.
function attachItems(roles, ...sources) {
  const itemsByKey = new Map();
  for (const source of sources) {
    if (source == null) continue;
    for (const roleset of normalizeRoles(source)) {
      for (const slot of roleset) {
        if (!slot.items.length) continue;
        const key = formatRoleKey(slot);
        if (!itemsByKey.has(key)) itemsByKey.set(key, slot.items.slice());
      }
    }
  }
  return normalizeRoles(roles).map((roleset) =>
    roleset.map((slot) => {
      if (slot.items.length) return slot;
      const saved = itemsByKey.get(formatRoleKey(slot));
      if (!saved) return slot;
      return { ...slot, items: saved.slice() };
    })
  );
}

function plainCount(count) {
  if (count == null) return count;
  if (count instanceof Map) return Object.fromEntries(count);
  if (typeof count.toObject === "function") return plainCount(count.toObject());
  return count;
}

function hashSetup(setup) {
  const payload = {
    gameType: setup.gameType,
    name: setup.name,
    roles: canonicalizeRoles(setup.roles, setup.gameType),
    closed: Boolean(setup.closed),
    unique: Boolean(setup.unique),
    uniqueWithoutModifier: Boolean(setup.uniqueWithoutModifier),
    useRoleGroups: Boolean(setup.useRoleGroups),
    roleGroupSizes: [...(setup.roleGroupSizes || [])],
    count: plainCount(setup.count),
    total: setup.total,
    gameSettings: plainCount(setup.gameSettings) || {},
    startState: setup.startState,
    gameStartPrompt: setup.gameStartPrompt || "",
    EventsPerNight: setup.EventsPerNight,
    NoEventChance: setup.NoEventChance,
    noDeathLimit: setup.noDeathLimit,
    ForceMustAct: setup.ForceMustAct,
    GameEndEvent: setup.GameEndEvent,
    firstTeamSize: setup.firstTeamSize,
    lastTeamSize: setup.lastTeamSize,
    numMissions: setup.numMissions,
    teamFailLimit: setup.teamFailLimit,
  };
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key];
  }
  return oHash(payload);
}

module.exports = {
  isRoleSlot,
  parseRoleKey,
  formatRoleKey,
  normalizeRoleset,
  normalizeRoles,
  toCountMap,
  toCountMaps,
  roleCount,
  compareRoleKeys,
  canonicalizeRoles,
  attachItems,
  plainCount,
  hashSetup,
};
