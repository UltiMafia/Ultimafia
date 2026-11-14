const assert = require('node:assert/strict');
const {
  normalizeRole,
  roleKey,
  roleStatsKey,
  roleName,
  roleModifiers,
  roleWith,
  roleEquals,
  toRoleGroups,
  toRoleMaps,
  serializeRoleGroups,
  serializeRoleMaps,
} = require('../lib/roleIdentity');

describe('role identity', function () {
  it('normalizes legacy strings, canonical keys, and descriptors to fresh descriptors', function () {
    assert.deepEqual(normalizeRole('Cop:Night'), { name: 'Cop', modifiers: ['Night'], items: [] });
    assert.deepEqual(normalizeRole('Cop:Night/Hidden'), { name: 'Cop', modifiers: ['Night', 'Hidden'], items: [] });
    assert.deepEqual(normalizeRole({ name: 'Cop', modifier: 'Night/Hidden' }), { name: 'Cop', modifiers: ['Night', 'Hidden'], items: [] });
    assert.deepEqual(normalizeRole({ name: 'Cop', modifiers: ['Hidden', 'Night'], items: [] }), { name: 'Cop', modifiers: ['Hidden', 'Night'], items: [] });
    assert.notEqual(normalizeRole({ name: 'Cop' }), normalizeRole({ name: 'Cop' }));
  });

  it('round-trips item identities in a JSON third segment and accepts maintainer comma-list keys', function () {
    const descriptor = { name: 'Cop', modifiers: ['Night'], items: ['Gun', 'Armor'] };
    assert.deepEqual(normalizeRole(roleKey(descriptor)), normalizeRole(descriptor));
    assert.deepEqual(normalizeRole('Cop:Night:Gun,Armor'), descriptor);
    assert.deepEqual(normalizeRole('Cop::Gun,Armor'), { name: 'Cop', modifiers: [], items: ['Gun', 'Armor'] });
    assert.deepEqual(normalizeRole('Cop::Gun'), { name: 'Cop', modifiers: [], items: ['Gun'] });
    assert.deepEqual(normalizeRole('Cop::not-json'), { name: 'Cop', modifiers: [], items: ['not-json'] });
  });

  it('rejects colon delimiters in modifiers so modifier identity round-trips', function () {
    for (const value of [
      { name: 'Cop', modifiers: ['Night:Hidden'] },
      { name: 'Cop', modifier: 'Night:Hidden' },
    ]) {
      assert.throws(() => normalizeRole(value), TypeError, `expected rejection for ${JSON.stringify(value)}`);
    }
  });

  it('rejects malformed JSON-looking item suffixes without disabling legacy comma lists', function () {
    for (const value of ['Cop::[bad', 'Cop::{oops']) {
      assert.throws(() => normalizeRole(value), TypeError, `expected rejection for ${value}`);
    }
    assert.deepEqual(normalizeRole('Cop::Gun,Armor'), { name: 'Cop', modifiers: [], items: ['Gun', 'Armor'] });
    assert.deepEqual(normalizeRole('Cop::Gun'), { name: 'Cop', modifiers: [], items: ['Gun'] });
  });

  it('keeps custom inventories distinct and serializes deterministically without changing modifier order', function () {
    const one = { name: 'Cop', modifiers: ['Night', 'Hidden'], items: [{ type: 'Gun', args: [{ z: 1, a: 2 }] }] };
    const same = { name: 'Cop', modifiers: ['Hidden', 'Night'], items: [{ args: [{ a: 2, z: 1 }], type: 'Gun' }] };
    const other = { ...same, items: ['Armor'] };
    assert.equal(roleKey(one), roleKey(same));
    assert.notEqual(roleKey(same), roleKey(other));
    assert.equal(roleKey({ name: 'Cop', modifiers: [], items: [] }), 'Cop:');
    assert.equal(roleKey('Cop:Humble'), 'Cop:Humble');
    assert.deepEqual(normalizeRole(one).modifiers, ['Night', 'Hidden']);
    assert.equal(roleEquals(one, same), true);
    assert.equal(roleEquals(one, other), false);
  });

  it('provides accessors and roleWith without mutating its source', function () {
    const source = { name: 'Cop', modifier: 'Night/Hidden', items: ['Gun'] };
    assert.equal(roleName(source), 'Cop');
    assert.equal(roleModifiers(source), 'Night/Hidden');
    assert.deepEqual(roleWith(source, { name: 'Detective', modifiers: ['Day'] }), { name: 'Detective', modifiers: ['Day'], items: ['Gun'] });
    assert.deepEqual(source, { name: 'Cop', modifier: 'Night/Hidden', items: ['Gun'] });
  });

  it('accepts runtime roles only through their plain toRoleData descriptor', function () {
    class RuntimeRole {
      toRoleData() { return { name: 'Cop', modifiers: ['Night'], items: ['Gun'] }; }
    }
    assert.deepEqual(normalizeRole(new RuntimeRole()), { name: 'Cop', modifiers: ['Night'], items: ['Gun'] });
  });

  it('deep-copies item data in both directions', function () {
    const input = { name: 'Cop', items: [{ type: 'Gun', args: [{ nested: [1] }] }] };
    const normalized = normalizeRole(input);
    normalized.items[0].args[0].nested[0] = 9;
    assert.equal(input.items[0].args[0].nested[0], 1);
    const viaKey = normalizeRole(roleKey(input));
    viaKey.items[0].args[0].nested[0] = 7;
    assert.equal(input.items[0].args[0].nested[0], 1);
  });

  it('rejects malformed identity, item, and serialized-key inputs', function () {
    for (const value of [null, 1, [], {}, { name: '' }, { name: 'Cop', modifiers: 'Night' }, { name: 'Cop', modifier: 2 }, { name: 'Cop', items: {} }, { name: 'Cop', items: [null] }, { name: 'Cop', items: [{ type: 'Gun', args: {} }] }, ':Night']) {
      assert.throws(() => normalizeRole(value), TypeError, `expected rejection for ${JSON.stringify(value)}`);
    }
  });

  it('normalizes legacy count maps and entry arrays, deduplicating only within each group', function () {
    const a = { name: 'Cop', modifiers: [], items: ['Gun'] };
    const b = { name: 'Cop', modifiers: [], items: ['Armor'] };
    const groups = [[{ role: a, count: 2 }, { role: a, count: 3 }, { role: b, count: 1 }], [{ role: a, count: 4 }]];
    const expected = [[{ role: normalizeRole(a), count: 5 }, { role: normalizeRole(b), count: 1 }], [{ role: normalizeRole(a), count: 4 }]];
    assert.deepEqual(toRoleGroups(groups), expected);
    const oldGroups = [[{ role: a, count: 2 }, { role: b, count: 1 }], [{ role: a, count: 4 }]];
    assert.deepEqual(toRoleGroups(JSON.stringify([{ [roleKey(a)]: 2, [roleKey(b)]: 1 }, { [roleKey(a)]: 4 }])), toRoleGroups(oldGroups));
    assert.deepEqual(toRoleMaps(groups), [{ [roleKey(a)]: 5, [roleKey(b)]: 1 }, { [roleKey(a)]: 4 }]);
    assert.equal(serializeRoleGroups(groups), JSON.stringify(expected));
    assert.equal(serializeRoleMaps(groups), JSON.stringify(toRoleMaps(groups)));
  });

  it('uses exact legacy stat keys without items and escaped canonical keys with items', function () {
    assert.equal(roleStatsKey({ name: 'Villager', modifiers: [], items: [] }), 'Villager');
    assert.equal(roleStatsKey({ name: 'Cop', modifiers: ['Night', 'Hidden'], items: [] }), 'Cop:Night/Hidden');
    const keys = ['a.b', 'a_b', 'a%2Eb', '$field'].map(arg => roleStatsKey({
      name: 'Villager', modifiers: [], items: [{ type: 'Pack', args: [arg] }],
    }));
    assert.equal(new Set(keys).size, 4);
    assert(keys.every(key => !/[.$]/.test(key)));
    assert(keys.some(key => key.includes('%2E')));
    assert(keys.some(key => key.includes('%252E')));
    assert(keys.some(key => key.includes('%24')));
  });

  it('rejects invalid groups, counts, and argument types', function () {
    for (const value of [null, 1, {}, 'not json', '[{}]', [[{ role: { name: 'Cop' }, count: 0 }]], [[{ role: { name: 'Cop' }, count: -1 }]], [[{ role: { name: 'Cop' }, count: 1.5 }]], [[{ role: { name: 'Cop' }, count: '2' }]], [[{ role: { name: 'Cop' }, count: Number.MAX_SAFE_INTEGER + 1 }]]]) {
      assert.throws(() => toRoleGroups(value), TypeError, `expected rejection for ${JSON.stringify(value)}`);
    }
    assert.throws(() => roleWith({ name: 'Cop' }, null), TypeError);
    assert.throws(() => roleEquals({ name: 'Cop' }, 'bad::{}'), TypeError);
  });
});
