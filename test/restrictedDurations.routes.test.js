// Real Express host/rehost routes and real mutation methods; storage,
// permissions and the game-worker boundary are controlled, not live services.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const express = require("express");
const constants = require("../data/constants");
const root = path.join(__dirname, "..");
const clone = value => JSON.parse(JSON.stringify(value));
function load(relative, dependencies, source) {
  const filename = path.join(root, relative);
  const module = { exports: {} };
  vm.runInNewContext(source || fs.readFileSync(filename, "utf8"), {
    module, exports: module.exports, Buffer, setTimeout, clearTimeout,
    process: { env: { NODE_ENV: "test", BOT_KEY: "unused-fixture-bot-key" } },
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency ${relative}: ${name}`);
      return dependencies[name];
    },
  }, { filename });
  return module.exports;
}
function query(value) {
  return {
    select() { return this; }, populate() { return this; }, lean() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}
const defaults = Object.fromEntries(Object.entries(constants.configurableStates.Mafia)
  .map(([name, limits]) => [name, limits.default]));
const custom = Object.fromEntries(Object.entries(constants.configurableStates.Mafia)
  .map(([name, limits]) => [name, limits.min / 60000]));
function body(mode, extra = {}) {
  return {
    gameType: "Mafia", setup: "duration-setup", lobby: mode === "competitive" ? "Competitive" : "Main",
    ranked: mode === "ranked", competitive: mode === "competitive",
    pregameWaitLength: 4, extendLength: 1, stateLengths: { ...custom }, ...extra,
  };
}
function fixture() {
  const state = { created: [], games: new Map(), claims: new Map(), errors: [], authCalls: 0, source: null, record: null };
  const setup = { id: "duration-setup", name: "Fixture", gameType: "Mafia", ranked: true, total: 5, roles: '[{"Villager":4,"Mafioso":1}]' };
  const setupDoc = { ...setup, toJSON: () => ({ ...setup }) };
  const models = {
    Setup: { findOne: () => query(setupDoc) },
    LeavePenalty: { findOne: () => query(null) },
    Game: { findOne: () => query(state.record) },
    User: { findOne: () => query({ _id: "host-db", id: "host", name: "Fixture" }) },
  };
  const redis = {
    getUserInfo: async () => ({ name: "Fixture", redHearts: 5, goldHearts: 5 }),
    getCompRoundInfo: async () => ({ round: { completed: false }, seasonPaused: false, allowedSetups: [{ id: setup.id }] }),
    getSetCreatingGame: async () => false, unsetCreatingGame: async () => {},
    inGame: async () => null, hostingScheduled: async () => false,
    getOpenGames: async () => [],
    getGameInfo: async id => id === "old-game" ? state.source : state.games.get(id),
    claimRehost: async (id, token) => { state.claims.set(id, `pending:${token}`); return true; },
    getRehost: async id => state.claims.get(id),
    finishRehost: async (id, gameId) => { state.claims.set(id, gameId); },
    releaseRehost: async id => { state.claims.delete(id); },
  };
  const lobbyName = require("../modules/lobbyName");
  const rehost = load("modules/rehost.js", {
    "../db/models": models, crypto: require("node:crypto"), "./redis": redis, "./lobbyName": lobbyName,
  });
  const router = load("routes/game.js", {
    "../Games/core/tutorial/storylines": {}, "../Games/core/tutorial/setup": { id: "fixture-tutorial" },
    express, "../data/constants": constants, "../db/models": models,
    "./utils": {
      verifyLoggedIn: async () => { state.authCalls++; return "host"; },
      verifyPermission: async () => true, validProp: value => /^[a-zA-Z0-9 -]+$/.test(value),
      rateLimit: async () => true,
    },
    "./gameListPaging": {}, "../lib/Utils": {}, "../modules/redis": redis,
    "../modules/gameLoadBalancer": {
      createGame: async (userId, type, settings) => {
        const id = `created-${state.created.length}`;
        state.created.push(clone({ userId, type, settings }));
        state.games.set(id, clone({ id, type, hostId: userId, settings }));
        return id;
      },
      notifyRehost: async () => {},
    },
    "../modules/rehost": rehost, "../modules/lobbyName": lobbyName,
    "../modules/reviewPlayerSettings": {}, "../modules/blocks": {},
    "../modules/logging": () => ({ error: error => state.errors.push(String(error)) }),
    axios: () => { throw new Error("No external notifications allowed"); },
    "../modules/devApi/policy": { devApiEnabled: () => false },
    "../lib/errors": require("../lib/errors"),
  }, process.env.DURATION_ROUTE_BASELINE ? execFileSync("git", ["show", `${process.env.DURATION_ROUTE_BASELINE}:routes/game.js`], { cwd: root, encoding: "utf8" }) : undefined);
  const app = express();
  app.use(express.json());
  app.use("/api/game", router);
  return { state, app };
}
describe("Duration HTTP boundary (controlled services)", function () {
  this.timeout(10000);
  let state, server, url;
  beforeEach(async () => {
    const fixtureState = fixture(); state = fixtureState.state;
    server = await new Promise(resolve => {
      const listening = fixtureState.app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    url = `http://127.0.0.1:${server.address().port}/api/game`;
  });
  afterEach(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    assert.deepEqual(state.errors, []);
  });
  async function post(payload) {
    const response = await fetch(`${url}/host`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    const id = await response.text();
    assert.equal(response.status, 200, id);
    assert.ok(state.authCalls > 0, "request traverses the session-authentication seam, not BOT_KEY");
    const read = await fetch(`${url}/${id}/info`, { signal: AbortSignal.timeout(5000) });
    assert.equal(read.status, 200);
    return (await read.json()).settings;
  }
  for (const mode of ["ranked", "competitive"]) {
    for (const name of Object.keys(defaults)) {
      it(`${mode}: handcrafted ${name} override cannot reach creation`, async () => {
        const settings = await post(body(mode, { stateLengths: { [name]: 1, Unknown: 1 } }));
        assert.equal(settings[mode], true);
        assert.deepEqual(settings.stateLengths, defaults);
        assert.equal(settings.pregameWaitLength, 4);
        assert.equal(settings.extendLength, constants.competitiveDefaults.Mafia.extendLength);
      });
    }
    it(`${mode}: changing a customized host form to restricted normalizes every timer`, async () => {
      const customized = body(null);
      const original = await post(customized);
      assert.deepEqual(original.stateLengths, Object.fromEntries(Object.entries(custom).map(([name, value]) => [name, value * 60000])));
      const switched = await post({ ...customized, [mode]: true, lobby: mode === "competitive" ? "Competitive" : "Main" });
      assert.deepEqual(switched.stateLengths, defaults);
      assert.equal(switched.extendLength, constants.competitiveDefaults.Mafia.extendLength);
      assert.equal(switched.pregameWaitLength, 4);
    });
    it(`${mode}: later host submissions preserve new pregame values but not gameplay edits`, async () => {
      await post(body(mode));
      const settings = await post(body(mode, { pregameWaitLength: 6, stateLengths: { Day: "1", Night: "1" }, extendLength: 0 }));
      assert.equal(state.created.length, 2, "host creates new games; it is not a live settings edit API");
      assert.equal(settings.pregameWaitLength, 6);
      assert.deepEqual(settings.stateLengths, defaults);
      assert.equal(settings.extendLength, constants.competitiveDefaults.Mafia.extendLength);
    });
    it(`${mode}: omitted UI gameplay fields still produce defaults`, async () => {
      const payload = body(mode); delete payload.stateLengths; delete payload.extendLength;
      const settings = await post(payload);
      assert.deepEqual(settings.stateLengths, defaults);
      assert.equal(settings.extendLength, constants.competitiveDefaults.Mafia.extendLength);
      assert.equal(settings.pregameWaitLength, 4);
    });
    for (const storage of ["postgame", "record"]) {
      it(`${mode}: ${storage} rehost restores original mode before normalizing legacy custom durations`, async () => {
        const settings = {
          setup: "duration-setup", lobbyNameCustom: false,
          ranked: false, competitive: false, [`original${mode[0].toUpperCase()}${mode.slice(1)}`]: true,
          stateLengths: Object.fromEntries(Object.keys(defaults).map(name => [name, 60000])),
          gameTypeOptions: JSON.stringify({ extendLength: 1, pregameWaitLength: 5 }),
        };
        const lobby = mode === "competitive" ? "Competitive" : "Main";
        if (storage === "postgame") state.source = { type: "Mafia", hostId: "host", players: ["host"], lobby, settings };
        else state.record = { ...settings, type: "Mafia", lobby, setup: { id: "duration-setup" }, users: [{ _id: "host-db", id: "host" }] };
        const result = await post(body(null, { rehost: "old-game", scheduled: Date.now() + 600000 }));
        assert.equal(result[mode], true);
        assert.deepEqual(result.stateLengths, defaults);
        assert.equal(result.extendLength, constants.competitiveDefaults.Mafia.extendLength);
        assert.equal(result.pregameWaitLength, 5);
        assert.equal(result.rehostId, "old-game");
        assert.equal(result.scheduled, null, "rehost discards original/request schedule (NaN serializes to null)");
        assert.equal(state.claims.get("old-game"), "created-0");
      });
    }
  }
  it("unrestricted: preserves all valid custom phases, extension and pregame", async () => {
    const settings = await post(body(null));
    assert.deepEqual(settings.stateLengths, Object.fromEntries(Object.entries(custom).map(([name, value]) => [name, value * 60000])));
    assert.equal(settings.extendLength, 1);
    assert.equal(settings.pregameWaitLength, 4);
  });
  it("unrestricted: rehost keeps customized durations instead of applying restricted defaults", async () => {
    state.source = { type: "Mafia", hostId: "host", players: ["host"], lobby: "Main", settings: {
      setup: "duration-setup", lobbyNameCustom: false, ranked: false, competitive: false,
      stateLengths: Object.fromEntries(Object.entries(custom).map(([name, value]) => [name, value * 60000])),
      gameTypeOptions: { extendLength: 1, pregameWaitLength: 6 },
    } };
    const settings = await post(body(null, { rehost: "old-game" }));
    assert.deepEqual(settings.stateLengths, state.source.settings.stateLengths);
    assert.equal(settings.extendLength, 1);
    assert.equal(settings.pregameWaitLength, 6);
  });
});

// Do not import core/Game: doing so registers a worker in Redis. Execute the
// complete real setup-change methods and the actual player socket callback.
const gameSource = fs.readFileSync(path.join(root, "Games/core/Game.js"), "utf8");
const playerSource = fs.readFileSync(path.join(root, "Games/core/Player.js"), "utf8");
function slice(source, start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Missing method markers: ${start}`);
  return source.slice(from, to);
}
describe("Existing live setup-change mutation boundary", function () {
  for (const mode of ["ranked", "competitive"]) {
    for (const started of [false, true]) {
      it(`${mode} ${started ? "started" : "pregame"}: direct and socket setup-change requests cannot alter timing`, async () => {
        let reads = 0, writes = 0;
        const methods = vm.runInNewContext(`({${slice(gameSource, "  canChangeSetup() {", "  async changeSetup(setupID) {")},${slice(gameSource, "  async changeSetup(setupID) {", "  checkGameEnd() {")}})`, {
          models: { Setup: { findOne: async () => { reads++; throw new Error("Must reject before setup load"); } } },
          redis: { setGameSetup: () => { writes++; } },
        });
        const game = { ...methods, [mode]: true, started, finished: false, hostId: "host",
          players: [{ user: { id: "host" } }], setup: { id: "original" },
          states: [{ name: "Day", length: defaults.Day }], sendAlert() {},
        };
        const before = clone({ setup: game.setup, states: game.states });
        await game.changeSetup("one-minute-fixed-timer-setup");
        let callback;
        vm.runInNewContext(`(function () {${slice(playerSource, '    socket.on("changeSetup",', '    socket.on("slurDetected",')}}).call(player);`, {
          socket: { on: (name, listener) => { assert.equal(name, "changeSetup"); callback = listener; } },
          player: { user: { id: "host" }, game }, Utils: { validProp: () => true },
          logger: { error: error => { throw error; } },
        });
        callback("one-minute-fixed-timer-setup");
        assert.equal(reads, 0); assert.equal(writes, 0);
        assert.deepEqual(clone({ setup: game.setup, states: game.states }), before);
      });
    }
  }
  it("unrestricted pregame retains setup customization eligibility", () => {
    const methods = vm.runInNewContext(`({${slice(gameSource, "  canChangeSetup() {", "  async changeSetup(setupID) {")}})`);
    assert.equal(methods.canChangeSetup.call({ ranked: false, competitive: false, started: false, finished: false }), true);
  });
});
