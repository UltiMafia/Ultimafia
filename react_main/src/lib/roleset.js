// Display-side reader for setup roles. The stored form is an array of
// rolesets, each an array of { name, modifiers, items, count }. Older
// payloads are still a JSON string of "Role:Mod1/Mod2" -> count maps.
// Keep parseRoleKey / formatRoleKey in sync with lib/roleset.js.

export function parseRoleKey(key) {
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

export function formatRoleKey(slot) {
  const name = slot && slot.name ? String(slot.name) : "";
  const modifiers = (slot && slot.modifiers ? slot.modifiers : []).filter(Boolean);
  if (!modifiers.length) return `${name}:`;
  return `${name}:${modifiers.join("/")}`;
}

function isRoleSlot(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof value.name === "string" &&
      Array.isArray(value.modifiers)
  );
}

function isLegacyRoleset(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "number");
}

function slotCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeRoleset(roleset) {
  if (roleset == null) return [];
  if (Array.isArray(roleset)) {
    if (roleset.length === 0 || isRoleSlot(roleset[0])) {
      return roleset.filter(isRoleSlot).map((slot) => ({
        name: String(slot.name),
        modifiers: slot.modifiers.filter(Boolean).map(String),
        items: Array.isArray(slot.items) ? slot.items.filter(Boolean) : [],
        count: slotCount(slot.count),
      }));
    }
    return [];
  }
  if (isLegacyRoleset(roleset)) {
    return Object.keys(roleset).map((key) => {
      const parsed = parseRoleKey(key);
      return { ...parsed, count: slotCount(roleset[key]) };
    });
  }
  return [];
}

export function normalizeRoles(roles) {
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

export function toCountMap(roleset) {
  const map = {};
  for (const slot of normalizeRoleset(roleset)) {
    const key = formatRoleKey(slot);
    map[key] = slotCount(map[key]) + slot.count;
  }
  return map;
}

export function toCountMaps(roles) {
  return normalizeRoles(roles).map(toCountMap);
}

export function isCountMapRoles(roles) {
  if (!Array.isArray(roles)) return false;
  return roles.every((group) => {
    if (!group || typeof group !== "object" || Array.isArray(group)) return false;
    return Object.values(group).every((value) => typeof value === "number");
  });
}

// Count maps are what the setup icons already render. Leave them in place
// so a second pass does not rebuild the same lists.
export function asCountMaps(roles) {
  if (isCountMapRoles(roles)) return roles;
  return toCountMaps(roles);
}
