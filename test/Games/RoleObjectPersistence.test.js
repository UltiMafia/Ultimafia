const assert = require("node:assert/strict");
const shortid = require("shortid");
const db = require("../../db/db");
const models = require("../../db/models");
const identity = require("../../lib/roleIdentity");
const { serializeSetupRoles, setupRolesForApi } = require("../../lib/setupRoleCompatibility");

describe("Role object Mongo persistence", function () {
  this.timeout(10000);
  const setupIds = [], versionIds = [], gameIds = [];
  before(async function () { await db.promise; });
  afterEach(async function () {
    if (gameIds.length) await models.Game.deleteMany({ _id: { $in: gameIds.splice(0) } });
    if (versionIds.length) await models.SetupVersion.deleteMany({ _id: { $in: versionIds.splice(0) } });
    if (setupIds.length) await models.Setup.deleteMany({ _id: { $in: setupIds.splice(0) } });
  });

  it("reads object-entry setup groups back from the real schema without losing inventories or group boundaries", async function () {
    const groups = [[
      { role: { name: "Villager", items: ["Gun"] }, count: 1 },
      { role: { name: "Villager", items: ["Armor"] }, count: 2 },
    ], [{ role: { name: "Mafioso", modifiers: ["Humble"] }, count: 1 }]];
    const saved = await models.Setup.create({ id: `role-object-db-${shortid.generate()}`,
      name: "Role persistence fixture", gameType: "Mafia", roles: serializeSetupRoles(groups) });
    setupIds.push(saved._id);
    const read = await models.Setup.findById(saved._id).lean();
    assert.deepEqual(identity.toRoleGroups(read.roles), identity.toRoleGroups(groups));
    assert(Array.isArray(JSON.parse(read.roles)[0]));
    assert.deepEqual(JSON.parse(setupRolesForApi(read.roles)), identity.toRoleMaps(groups));
  });

  it("keeps distinct custom inventory arguments in separate safe granular-stat fields", async function () {
    assert.equal(typeof identity.roleStatsKey, "function");
    const roles = ["a.b", "a_b", "a%2Eb", "$field"].map((label) => ({
      name: "Villager", modifiers: [], items: [{ type: "Gun", args: [{ shooterMask: label }] }],
    }));
    const keys = roles.map(identity.roleStatsKey);
    assert.equal(new Set(keys).size, roles.length);
    const saved = await models.SetupVersion.create({ version: 0 });
    versionIds.push(saved._id);
    const increments = Object.fromEntries(keys.map((key) => [`setupStats.roleAgg.${key}.unranked.games`, 1]));
    await models.SetupVersion.updateOne({ _id: saved._id }, { $inc: increments });
    const read = await models.SetupVersion.findById(saved._id).lean();
    assert.deepEqual(Object.keys(read.setupStats.roleAgg).sort(), keys.slice().sort());
    for (const key of keys) assert.equal(read.setupStats.roleAgg[key].unranked.games, 1);
  });

  it("retains complete serialized identities through stored game-history readback", async function () {
    const role = { name: "Villager", modifiers: ["Retired"], items: [{ type: "Gun", args: [{ shooterMask: "a:b,c" }] }] };
    const saved = await models.Game.create({ id: `role-history-db-${shortid.generate()}`,
      type: "Mafia", history: JSON.stringify({ "-1": { roles: { player: identity.roleKey(role) } } }) });
    gameIds.push(saved._id);
    const read = await models.Game.findById(saved._id).lean();
    const key = JSON.parse(read.history)["-1"].roles.player;
    assert.equal(typeof key, "string");
    assert.deepEqual(identity.normalizeRole(key), identity.normalizeRole(role));
  });
});
