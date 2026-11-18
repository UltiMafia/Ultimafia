'use strict';

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function copyJson(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new TypeError('Cyclic JSON data is not supported');
    seen.add(value);
    const result = value.map(item => copyJson(item, seen));
    seen.delete(value);
    return result;
  }
  if (isPlainObject(value)) {
    if (seen.has(value)) throw new TypeError('Cyclic JSON data is not supported');
    seen.add(value);
    const result = {};
    for (const key of Object.keys(value)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw new TypeError('Unsafe JSON object key');
      result[key] = copyJson(value[key], seen);
    }
    seen.delete(value);
    return result;
  }
  throw new TypeError('Value is not JSON-compatible');
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function parseModifiers(value) {
  if (value === undefined || value === null || value === '') return [];
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split('/') : null;
  if (!values || values.some(modifier => typeof modifier !== 'string' || !modifier.length || modifier.includes('/') || modifier.includes(':'))) {
    throw new TypeError('Role modifiers must be non-empty strings');
  }
  return values.slice();
}

function validateItems(items) {
  if (items === undefined) return [];
  if (!Array.isArray(items)) throw new TypeError('Role items must be an array');
  return items.map(item => {
    if (typeof item === 'string' && item.length) return item;
    if (!isPlainObject(item) || typeof item.type !== 'string' || !item.type.length || !Array.isArray(item.args)) {
      throw new TypeError('Role item must be a name or {type, args}');
    }
    return { type: item.type, args: copyJson(item.args) };
  });
}

function fromString(value) {
  if (!value.length) throw new TypeError('Role identity must not be empty');
  const first = value.indexOf(':');
  const name = first === -1 ? value : value.slice(0, first);
  if (!name) throw new TypeError('Role name must be a non-empty string');
  const second = first === -1 ? -1 : value.indexOf(':', first + 1);
  const modifierText = first === -1 ? '' : value.slice(first + 1, second === -1 ? undefined : second);
  let items = [];
  if (second !== -1) {
    const itemText = value.slice(second + 1);
    if (itemText) {
      try {
        items = JSON.parse(itemText);
      } catch (error) {
        if (/^[\[{]/.test(itemText)) throw new TypeError('Malformed JSON role item suffix');
        // Older maintainers used comma-delimited item names in this segment.
        items = itemText.split(',');
      }
      if (typeof items === 'string') items = [items];
    }
  }
  return { name, modifiers: parseModifiers(modifierText), items: validateItems(items) };
}

function normalizeRole(value) {
  if (typeof value === 'string') return fromString(value);
  if (value && typeof value === 'object' && typeof value.toRoleData === 'function') return normalizeRole(value.toRoleData());
  if (!isPlainObject(value)) throw new TypeError('Role must be a string or descriptor object');
  const name = value.name;
  if (typeof name !== 'string' || !name.length || name.includes(':')) throw new TypeError('Role name must be a non-empty string');
  if (hasOwn(value, 'modifiers') && !Array.isArray(value.modifiers)) throw new TypeError('Role modifiers must be an array');
  const modifiers = hasOwn(value, 'modifiers') ? parseModifiers(value.modifiers) : parseModifiers(value.modifier);
  return { name, modifiers, items: validateItems(value.items) };
}

function roleKey(value) {
  const role = normalizeRole(value);
  const modifiers = role.modifiers.slice().sort();
  const items = role.items.length ? `:${stableJson(role.items)}` : '';
  return `${role.name}:${modifiers.join('/')}${items}`;
}

function roleStatsKey(value) {
  const role = normalizeRole(value);
  if (role.items.length) {
    return roleKey(role)
      .replace(/%/g, '%25')
      .replace(/\./g, '%2E')
      .replace(/\$/g, '%24');
  }
  const modifier = role.modifiers.join('/');
  return `${role.name}${modifier ? `:${modifier}` : ''}`;
}

// Appearance strings show name and modifiers only. Items stay hidden, as a
// real role's appearance never carries them.
function appearanceKey(value) {
  const role = normalizeRole(value);
  const modifier = role.modifiers.join('/');
  return `${role.name}${modifier ? `:${modifier}` : ''}`;
}

function roleName(value) {
  return normalizeRole(value).name;
}

function roleModifiers(value) {
  return normalizeRole(value).modifiers.join('/');
}

function roleWith(value, changes) {
  if (!isPlainObject(changes)) throw new TypeError('Role changes must be an object');
  return normalizeRole({ ...normalizeRole(value), ...changes });
}

function roleEquals(a, b) {
  return roleKey(a) === roleKey(b);
}

function parseGroups(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch (error) { throw new TypeError('Role groups must be valid JSON'); }
  }
  if (!Array.isArray(value)) throw new TypeError('Role groups must be an array');
  return value.map(group => {
    if (!Array.isArray(group) && !isPlainObject(group)) throw new TypeError('Each role group must be an array or count map');
    const entries = new Map();
    if (isPlainObject(group) && Object.keys(group).length === 0) throw new TypeError('Count maps must not be empty');
    const sourceEntries = Array.isArray(group) ? group : Object.entries(group).map(([role, count]) => ({ role, count }));
    for (const item of sourceEntries) {
      let role;
      let count;
      if (isPlainObject(item) && hasOwn(item, 'role') && hasOwn(item, 'count')) {
        role = normalizeRole(item.role);
        count = item.count;
      } else if (isPlainObject(item)) {
        const itemEntries = Object.entries(item);
        if (!itemEntries.length) throw new TypeError('Count maps must not be empty');
        for (const [key, amount] of itemEntries) {
          role = normalizeRole(key);
          count = amount;
          add(role, count);
        }
        continue;
      } else {
        throw new TypeError('Role group entries must be descriptors or count maps');
      }
      add(role, count);
    }
    function add(role, count) {
      if (!Number.isSafeInteger(count) || count <= 0) throw new TypeError('Role counts must be positive safe integers');
      const key = roleKey(role);
      const current = entries.get(key);
      const total = (current ? current.count : 0) + count;
      if (!Number.isSafeInteger(total)) throw new TypeError('Combined role count exceeds safe integer range');
      if (current) current.count = total;
      else entries.set(key, { role: normalizeRole(role), count });
    }
    return [...entries.values()];
  });
}

function toRoleGroups(value) {
  return parseGroups(value);
}

function toRoleMaps(value) {
  return toRoleGroups(value).map(group => {
    const map = {};
    for (const { role, count } of group) map[roleKey(role)] = count;
    return map;
  });
}

function serializeRoleGroups(value) {
  return JSON.stringify(toRoleGroups(value));
}

function serializeRoleMaps(value) {
  return JSON.stringify(toRoleMaps(value));
}

module.exports = {
  normalizeRole,
  roleKey,
  roleStatsKey,
  appearanceKey,
  roleName,
  roleModifiers,
  roleWith,
  roleEquals,
  toRoleGroups,
  toRoleMaps,
  serializeRoleGroups,
  serializeRoleMaps,
};
