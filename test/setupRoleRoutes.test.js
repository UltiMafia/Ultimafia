const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { toRoleGroups, toRoleMaps, serializeRoleGroups } = require("../lib/roleIdentity");

// Execute the production Express handlers with storage/auth replaced, following
// the existing forum route-test pattern. Role validation/serialization are real.
function loadRouter(state) {
  const filename = path.join(__dirname, "../routes/setup.js");
  const nativeRequire = createRequire(filename);
  const query = (value) => ({
    select() { return this; }, populate() { return this; }, sort() { return this; },
    skip() { return this; }, limit() { return this; }, lean() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  });
  const json = (value) => JSON.parse(JSON.stringify(value));
  const doc = (value) => value && { ...json(value), toJSON() { return json(value); } };
  class Setup {
    constructor(value) { Object.assign(this, value); this._id = "507f1f77bcf86cd799439011"; this.version = 0; }
    async save() { state.setups[this.id] = json(this); }
  }
  Setup.findOne = (filter) => query(filter.hash ? null : doc(state.setups[filter.id]));
  Setup.find = (filter) => query(Object.values(state.setups)
    .filter((s) => !filter.copiedFrom || s.copiedFrom === filter.copiedFrom).map(doc));
  Setup.countDocuments = async () => Object.keys(state.setups).length;
  Setup.updateOne = () => ({ exec: async () => {} });
  class SetupVersion {
    constructor(value) { Object.assign(this, value); }
    async save() { state.versions.push(json(this)); }
  }
  SetupVersion.findOne = () => query(null);
  const noopUpdate = () => ({ exec: async () => {} });
  const utils = {
    verifyLoggedIn: async (req, optional) => optional ? undefined : "owner",
    verifyPermission: async () => true,
    rateLimit: async () => true,
    validProp: (key) => Object.prototype[key] == null,
  };
  const mocks = {
    "../db/models": { Setup, SetupVersion,
      User: { findOne: () => query(doc({ _id: "507f1f77bcf86cd799439012", setups: [] })), updateOne: noopUpdate },
      Game: { countDocuments: async () => 0 },
    },
    "./utils": utils,
    "../modules/redis": { getFavSetupsHashtable: async () => ({}) },
    "../modules/logging": () => ({ error: (e) => state.errors.push(e), warn() {} }),
    "../modules/devApi/requestUser": { requestUserObjectId: () => undefined },
    shortid: { generate: () => `setup-${++state.nextId}` },
    "object-hash": (input) => {
      state.hashInputs.push(input);
      return nativeRequire("object-hash")(input);
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
    module, exports: module.exports, console,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name),
  }, { filename });
  return module.exports;
}
function response() {
  return { statusCode: 200, body: undefined, setHeader() {},
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    sendStatus(code) { this.statusCode = code; return this; },
  };
}
function handler(router, method, url) {
  return router.stack.find((layer) => layer.route?.path === url && layer.route.methods[method]).route.stack[0].handle;
}

describe("Setup role object route wiring (mocked storage/auth)", function () {
  let state, router;
  beforeEach(function () { state = { setups: {}, versions: [], errors: [], hashInputs: [], nextId: 0 }; router = loadRouter(state); });
  const gun = { name: "Villager", modifiers: [], items: ["Gun"] };
  const armor = { name: "Villager", modifiers: [], items: [{ type: "Armor", args: [{ broken: false }] }] };
  const roles = [[{ role: gun, count: 1 }, { role: armor, count: 1 },
    { role: { name: "Villager" }, count: 2 }, { role: { name: "Mafioso" }, count: 1 }]];
  async function post(body = {}) {
    const res = response();
    await handler(router, "post", "/create")({ body: { name: "Object setup", gameType: "Mafia", count: {}, gameSettings: {}, roles, ...body } }, res);
    return res;
  }
  async function get(id) {
    const res = response();
    await handler(router, "get", "/:id")({ params: { id }, get: () => undefined }, res);
    return res;
  }
  it("POSTs object groups, persists descriptors and GETs legacy map JSON without merging inventories", async function () {
    const saved = await post();
    assert.equal(saved.statusCode, 200, state.errors.map(String).join("\n"));
    const persisted = state.setups[saved.body];
    assert(Array.isArray(JSON.parse(persisted.roles)[0]));
    assert.equal(toRoleGroups(persisted.roles)[0].length, 4);
    const read = await get(saved.body);
    assert.equal(read.statusCode, 200, state.errors.map(String).join("\n"));
    assert.equal(typeof read.body.roles, "string");
    assert.deepEqual(JSON.parse(read.body.roles), toRoleMaps(roles));
  });
  it("still saves and reads legacy map setups", async function () {
    const saved = await post({ roles: [{ "Villager:": 4, "Mafioso:": 1 }] });
    assert.equal(saved.statusCode, 200, state.errors.map(String).join("\n"));
    assert.deepEqual(JSON.parse((await get(saved.body)).body.roles), [{ "Villager:": 4, "Mafioso:": 1 }]);
  });
  it("preserves the legacy duplicate-setup hash independently of the new storage envelope", async function () {
    const saved = await post({ roles: [{ "Villager:": 4, "Mafioso:": 1 }] });
    assert.equal(saved.statusCode, 200, state.errors.map(String).join("\n"));
    const persisted = state.setups[saved.body];
    const hashInput = state.hashInputs.at(-1);
    assert.equal(hashInput.roles, JSON.stringify(toRoleMaps(persisted.roles)));
    assert.equal(persisted.hash, require("object-hash")(hashInput));
  });

  it("preserves inventories in the setup-version manifest even with no modifiers", async function () {
    const saved = await post();
    assert.equal(saved.statusCode, 200, state.errors.map(String).join("\n"));
    assert.match(state.versions[0].manifest, /Gun/);
    assert.match(state.versions[0].manifest, /Armor/);
  });
  it("retains parsed map arrays in the lineage response", async function () {
    state.setups.parent = { id: "parent", roles: serializeRoleGroups(roles) };
    state.setups.current = { id: "current", copiedFrom: "parent" };
    state.setups.child = { id: "child", copiedFrom: "current", roles: serializeRoleGroups(roles) };
    const res = response();
    await handler(router, "get", "/:id/lineage")({ params: { id: "current" } }, res);
    assert.equal(res.statusCode, 200);
    assert(Array.isArray(res.body.copiedFrom.setup.roles));
    assert.deepEqual(JSON.parse(JSON.stringify(res.body.copiedFrom.setup.roles)), toRoleMaps(roles));
    assert.deepEqual(JSON.parse(JSON.stringify(res.body.copiedTo[0].setup.roles)), toRoleMaps(roles));
  });
  it("adapts populated finished-game setups in profile responses", function () {
    const source = fs.readFileSync(path.join(__dirname, "../routes/user.js"), "utf8");
    const start = source.indexOf("    for (let game of user.games)");
    const end = source.indexOf("    var inGame =", start);
    assert(start !== -1 && end > start, "profile game serialization loop exists");
    const user = { games: [{ setup: { roles: serializeRoleGroups(roles) } }] };
    vm.runInNewContext(source.slice(start, end), {
      user, setupRoleCompatibility: require("../lib/setupRoleCompatibility"),
    });
    assert.equal(user.games[0].status, "Finished");
    assert.deepEqual(JSON.parse(user.games[0].setup.roles), toRoleMaps(roles));
  });

  it("rejects unknown roles as controlled validation errors before counting alignments", async function () {
    const result = await post({ roles: [{ "NotARealRole:": 4, "Mafioso:": 1 }] });
    assert.equal(result.statusCode, 422);
    assert.equal(Object.keys(state.setups).length, 0);
  });
  it("rejects unknown and traversal item types without persisting", async function () {
    for (const item of ["NotAnItem", "../Role", { type: "../Role", args: [] }]) {
      const result = await post({ roles: [[{ role: { name: "Villager", items: [item] }, count: 4 }, { role: { name: "Mafioso" }, count: 1 }]] });
      assert.equal(result.statusCode, 422);
    }
    assert.equal(Object.keys(state.setups).length, 0);
  });
});
