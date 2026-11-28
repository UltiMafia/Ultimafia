// Competitive fortune gate at the real HTTP boundary (host and connect).
// Storage, permissions and the game-worker boundary are controlled.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const express = require("express");
const constants = require("../data/constants");
const root = path.join(__dirname, "..");

function load(relative, dependencies) {
  const filename = path.join(root, relative);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
    module,
    exports: module.exports,
    Buffer,
    setTimeout,
    clearTimeout,
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
    select() { return this; },
    populate() { return this; },
    lean() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

const body = {
  gameType: "Mafia",
  setup: "fortune-setup",
  lobby: "Competitive",
  competitive: true,
  pregameWaitLength: 4,
  extendLength: 1,
};

function fixture({ points, goldHearts = 4, competitive = true } = {}) {
  const state = { created: [], games: new Map(), errors: [], authCalls: 0 };
  const setup = {
    id: "fortune-setup",
    name: "Fixture",
    gameType: "Mafia",
    ranked: true,
    competitive: true,
    total: 5,
    roles: '[{"Villager":4,"Mafioso":1}]',
  };
  const setupDoc = { ...setup, toJSON: () => ({ ...setup }) };
  const models = {
    Setup: { findOne: () => query(setupDoc) },
    LeavePenalty: { findOne: () => query(null) },
    Game: { findOne: () => query(null) },
    User: { findOne: () => query({ _id: "host-db", id: "host", name: "Fixture" }) },
  };
  const redis = {
    getUserInfo: async () => ({ name: "Fixture", redHearts: 5, goldHearts, points }),
    getCompRoundInfo: async () => ({ round: { completed: false }, seasonPaused: false, allowedSetups: [{ id: setup.id }] }),
    getSetCreatingGame: async () => false,
    unsetCreatingGame: async () => {},
    inGame: async () => null,
    hostingScheduled: async () => false,
    getOpenGames: async () => [],
    getGameInfo: async (id) => state.games.get(id),
    createAuthToken: async () => "token",
  };
  const lobbyName = require("../modules/lobbyName");
  const rehost = load("modules/rehost.js", {
    "../db/models": models,
    crypto: require("node:crypto"),
    "./redis": redis,
    "./lobbyName": lobbyName,
  });
  const router = load("routes/game.js", {
    "../Games/core/tutorial/storylines": {},
    "../Games/core/tutorial/setup": { id: "fixture-tutorial" },
    express,
    "../data/constants": constants,
    "../db/models": models,
    "./utils": {
      verifyLoggedIn: async () => { state.authCalls++; return "host"; },
      verifyPermission: async () => true,
      validProp: (value) => /^[a-zA-Z0-9 -]+$/.test(value),
      rateLimit: async () => true,
    },
    "./gameListPaging": {},
    "../lib/Utils": {},
    "../modules/redis": redis,
    "../modules/gameLoadBalancer": {
      createGame: async (userId, type, settings) => {
        const id = `created-${state.created.length}`;
        state.created.push({ userId, type, settings });
        state.games.set(id, { id, type, hostId: userId, settings });
        return id;
      },
      notifyRehost: async () => {},
    },
    "../modules/rehost": rehost,
    "../modules/lobbyName": lobbyName,
    "../modules/reviewPlayerSettings": {},
    "../modules/blocks": { gameBlockedWithAny: async () => false },
    "../modules/logging": () => ({ error: (error) => state.errors.push(String(error)) }),
    axios: () => { throw new Error("No external notifications allowed"); },
    "../modules/devApi/policy": { devApiEnabled: () => false },
    "../lib/errors": require("../lib/errors"),
  });
  const app = express();
  app.use(express.json());
  app.use("/api/game", router);
  return { state, app };
}

describe("Competitive fortune gate over HTTP", function () {
  this.timeout(10000);
  let server;

  afterEach(async function () {
    if (server) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      server = null;
    }
  });

  async function listen(fixtureState) {
    server = await new Promise((resolve) => {
      const listening = fixtureState.app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    return `http://127.0.0.1:${server.address().port}/api/game`;
  }

  async function host(url, payload) {
    const response = await fetch(`${url}/host`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return { status: response.status, text: await response.text() };
  }

  it("host rejects a competitive game below 500 fortune", async function () {
    const fixtureState = fixture({ points: 499 });
    const url = await listen(fixtureState);
    assert.equal(constants.competitiveFortuneRequirement, 500);
    assert.equal(fixtureState.state.authCalls, 0);
    const result = await host(url, body);
    assert.equal(result.status, 400);
    assert.equal(result.text, "You need at least 500 fortune to play competitive games.");
    assert.equal(fixtureState.state.created.length, 0);
    assert.deepEqual(fixtureState.state.errors, []);
    assert.ok(fixtureState.state.authCalls > 0, "request crosses the session seam");
  });

  it("host rejects a competitive game when fortune is missing", async function () {
    const fixtureState = fixture({});
    const url = await listen(fixtureState);
    const result = await host(url, body);
    assert.equal(result.status, 400);
    assert.equal(result.text, "You need at least 500 fortune to play competitive games.");
    assert.equal(fixtureState.state.created.length, 0);
  });

  it("host allows a competitive game at exactly 500 fortune", async function () {
    const fixtureState = fixture({ points: 500 });
    const url = await listen(fixtureState);
    const result = await host(url, body);
    assert.equal(result.status, 200, result.text);
    assert.equal(fixtureState.state.created.length, 1);
    assert.equal(fixtureState.state.created[0].settings.competitive, true);
    assert.deepEqual(fixtureState.state.errors, []);
  });

  it("joining a competitive game is refused below 500 fortune", async function () {
    const fixtureState = fixture({ points: 499 });
    const url = await listen(fixtureState);
    fixtureState.state.games.set("game-1", {
      id: "game-1",
      type: "Mafia",
      port: 3010,
      hostId: "host",
      lobby: "Competitive",
      players: [],
      settings: { ranked: false, competitive: true, guests: false },
    });
    const response = await fetch(`${url}/game-1/connect`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 400);
    assert.equal(await response.text(), "You need at least 500 fortune to play competitive games.");
    assert.deepEqual(fixtureState.state.errors, []);
  });

  it("joining a competitive game is allowed at exactly 500 fortune", async function () {
    const fixtureState = fixture({ points: 500 });
    const url = await listen(fixtureState);
    fixtureState.state.games.set("game-1", {
      id: "game-1",
      type: "Mafia",
      port: 3010,
      hostId: "host",
      lobby: "Competitive",
      players: [],
      settings: { ranked: false, competitive: true, guests: false },
    });
    const response = await fetch(`${url}/game-1/connect`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { port: 3010, type: "Mafia", token: "token", hostId: "host" });
    assert.deepEqual(fixtureState.state.errors, []);
  });

  it("spectating a competitive game does not require the fortune", async function () {
    const fixtureState = fixture({ points: 0 });
    const url = await listen(fixtureState);
    fixtureState.state.games.set("game-1", {
      id: "game-1",
      type: "Mafia",
      port: 3010,
      hostId: "host",
      lobby: "Competitive",
      players: [],
      settings: { ranked: false, competitive: true, guests: false },
    });
    const response = await fetch(`${url}/game-1/connect?spectate=true`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.deepEqual(fixtureState.state.errors, []);
  });
});
