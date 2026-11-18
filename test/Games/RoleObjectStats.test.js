const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { roleStatsKey } = require('../../lib/roleIdentity');

const repository = path.resolve(__dirname, '../..');
const models = {
  SetupVersion: {
    findOne: () => ({ select: async () => ({ _id: 'version-id' }) }),
    updateOne: (_filter, write) => ({ exec: async () => { models.lastWrite = write; } }),
  },
};
const roleIdentity = require('../../lib/roleIdentity');
const logger = { error() {}, info() {}, warn() {} };
const ObjectID = function ObjectID(value) { return value; };

function loadMethod(file, signature, nextSignature, dependencies) {
  const source = fs.readFileSync(path.join(repository, file), 'utf8');
  const start = source.indexOf(signature);
  const end = source.indexOf(nextSignature, start);
  assert.notEqual(start, -1, `missing ${signature}`);
  assert.notEqual(end, -1, `missing ${nextSignature}`);
  const method = source.slice(start, end).trim().replace(/,$/, '');
  return new Function(...Object.keys(dependencies), `return ({ ${method} }).${signature.match(/([A-Za-z0-9_]+)\(/)[1]}`)(...Object.values(dependencies));
}

const recordSetupStats = loadMethod(
  'Games/core/Game.js', 'async recordSetupStats(setup) {', 'async recordCompetitiveCompletions(',
  { models, ObjectID, logger, roleIdentity },
);
const dbStats = {
  ensureBucket(stats) { if (!stats.unranked) stats.unranked = {}; },
};
const recordStat = loadMethod(
  'Games/core/Player.js', 'recordStat(stat, inc) {', 'updateStatsMap(stats, mapName, key, stat, inc) {',
  { dbStats, logger, roleIdentity },
);

function makeGame({ players, originalRoles, winnerIds }) {
  return {
    players, originalRoles, playersGone: {}, hadVegKill: false,
    competitive: false, ranked: false, startTime: Date.now(),
    winners: { getPlayers: () => winnerIds },
    getRoleAlignment: () => 'Village',
    recordSetupStats,
  };
}

describe('granular role-object game stats', function () {
  beforeEach(function () { models.lastWrite = null; });

  it('writes separate final-role increments for inventories without mutating descriptors', async function () {
    const first = { name: 'Villager', modifiers: [], items: [{ type: 'Pack', args: ['a.b'] }] };
    const second = { name: 'Villager', modifiers: [], items: [{ type: 'Pack', args: ['a_b'] }] };
    const game = makeGame({
      players: {
        p1: { role: { ...first, alignment: 'Village', toRoleData: () => first } },
        p2: { role: { ...second, alignment: 'Village', toRoleData: () => second } },
      },
      originalRoles: { p1: first, p2: second }, winnerIds: ['p1'],
    });

    await game.recordSetupStats({ _id: 'setup-id', version: 0 });

    const inc = models.lastWrite.$inc;
    const firstKey = roleStatsKey(first);
    const secondKey = roleStatsKey(second);
    assert.equal(inc[`setupStats.roleAgg.${firstKey}.unranked.games`], 1);
    assert.equal(inc[`setupStats.roleAgg.${firstKey}.unranked.wins`], 1);
    assert.equal(inc[`setupStats.roleAgg.${secondKey}.unranked.games`], 1);
    assert.equal(inc[`setupStats.roleAgg.${secondKey}.unranked.wins`], undefined);
    assert.equal(inc['rolePlays.Villager'], 2);
    assert.equal(inc['alignmentPlays.Village'], 2);
    assert.equal(first.items[0].args[0], 'a.b');
    assert.equal(second.items[0].args[0], 'a_b');
    assert.notEqual(firstKey, secondKey);
  });

  it('keeps legacy no-item keys and credits a converted final role', async function () {
    const starting = { name: 'Villager', modifiers: [], items: [] };
    const fallback = { name: 'Villager', modifiers: ['Night', 'Hidden'], items: [] };
    const final = { name: 'Cultist', modifiers: [], items: [{ type: 'Pack', args: ['x'] }] };
    const game = makeGame({
      players: { p1: { role: { ...final, alignment: 'Cult', toRoleData: () => final } } },
      originalRoles: { p1: starting, p2: fallback }, winnerIds: ['p1'],
    });

    await game.recordSetupStats({ _id: 'setup-id', version: 0 });

    const inc = models.lastWrite.$inc;
    assert.equal(inc['setupStats.roleAgg.Villager.unranked.games'], undefined);
    assert.equal(inc[`setupStats.roleAgg.${roleStatsKey(final)}.unranked.games`], 1);
    assert.equal(inc[`setupStats.roleAgg.${roleStatsKey(final)}.unranked.wins`], 1);
    assert.equal(inc['setupStats.roleAgg.Villager:Night/Hidden.unranked.games'], 1);
    assert.equal(inc['rolePlays.Cultist'], 1);
    assert.equal(inc['rolePlays.Villager'], 1);
    assert.equal(inc['alignmentPlays.Cult'], 1);
    assert.equal(inc['alignmentPlays.Village'], 1);
  });

  it('uses the shared granular key for Player.recordStat custom-item stats', function () {
    const descriptor = { name: 'Villager', modifiers: [], items: [{ type: 'Pack', args: ['a.b'] }] };
    const player = {
      game: { type: 'Mafia', ranked: false, competitive: false, setup: { id: 'setup' }, id: 'game' },
      user: { id: 'user', stats: { Mafia: { unranked: {} } } },
      role: { ...descriptor, alignment: 'Village', toRoleData: () => descriptor },
      updateStatsObj(stats, stat, inc) {
        stats[stat] = { count: inc ? 1 : 0, total: 1 };
      },
      updateStatsMap(stats, mapName, key, stat) {
        (stats[mapName] ||= {})[key] ||= {};
        stats[mapName][key][stat] = { count: 1, total: 1 };
      },
    };
    recordStat.call(player, 'wins', true);
    assert.equal(player.user.stats.Mafia.unranked.byRole[roleStatsKey(descriptor)].wins.count, 1);
    assert.equal(Object.keys(player.user.stats.Mafia.unranked.byRole).length, 1);
  });
});
