const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exercise the production functions without opening Redis/Mongo connections.
function loadFunction(file, name, nextName, globals) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const start = source.indexOf(`async function ${name}(`);
  const end = source.indexOf(`async function ${nextName}(`, start);
  return vm.runInNewContext(
    `${source.slice(start, end)}; ${name}`, globals
  );
}

test("leaving a game without a server port clears persisted membership", async () => {
  const cleared = [];
  const leave = loadFunction("modules/gameLoadBalancer.js", "leaveGame", "cancelGame", {
    redis: {
      inGame: async () => "missing",
      getGamePort: async () => null,
      leaveGame: async (id) => cleared.push(id),
    },
    logger: { error() {} },
  });
  await leave("stuck");
  assert.deepEqual(cleared, ["stuck"]);
});

test("unresponsive game server rejects and releases the pending leave", async () => {
  const waiting = {};
  let onTimeout;
  const leave = loadFunction("modules/gameLoadBalancer.js", "leaveGame", "cancelGame", {
    redis: { inGame: async () => "gone", getGamePort: async () => "3010" },
    servers: { 3010: { send() {} } },
    waiting,
    process: { env: {} },
    setTimeout: (callback) => { onTimeout = callback; },
    clearTimeout() {},
    logger: { error() {} },
  });
  const result = leave("stuck");
  await new Promise(setImmediate);
  const rejected = assert.rejects(result, /Timeout leaving game/);
  onTimeout();
  await rejected;
  assert.equal(waiting.stuck, undefined);
});

test("Break Game repairs orphan pointers across SCAN pages without clearing other games", async () => {
  const pointers = new Map([
    ["user:stuck:game", "gone"],
    ["user:other:game", "live"],
    ["user:also-stuck:game", "gone"],
  ]);
  const cleared = [];
  const breakGame = loadFunction("modules/redis.js", "breakGame", "setSpectatorCount", {
    getGameInfo: async () => undefined,
    client: {
      scanAsync: async (cursor) => cursor === "0"
        ? ["1", ["user:stuck:game", "user:other:game"]]
        : ["0", ["user:also-stuck:game"]],
      getAsync: async (key) => pointers.get(key),
    },
    leaveGame: async (id) => cleared.push(id),
  });
  await breakGame("gone");
  assert.deepEqual(cleared, ["stuck", "also-stuck"]);
});

test("pregame expiry awaits each removal while the player collection changes", async () => {
  const source = fs.readFileSync(path.join(__dirname, "../Games/core/Game.js"), "utf8");
  const method = source.slice(source.indexOf("  startHostingTimer() {"), source.indexOf("  broadcast(eventName"));
  const timers = [];
  const players = [1, 2, 3];
  const removed = [];
  const game = {
    players,
    createTimer: (name, delay, callback) => timers.push(callback),
    sendAlert() {},
    kickPlayer: async (player) => {
      await Promise.resolve();
      removed.push(player);
      players.splice(players.indexOf(player), 1);
    },
  };
  vm.runInNewContext(`({${method}})`).startHostingTimer.call(game);
  timers.shift()();
  await timers.shift()();
  assert.deepEqual(removed, [1, 2, 3]);
});

test("Redis leave removes membership and game restrictions with mocked MongoDB", async () => {
  const calls = [];
  const leave = loadFunction("modules/redis.js", "leaveGame", "reserveGame", {
    client: {
      getAsync: async () => "gone",
      delAsync: async (key) => calls.push(["del", key]),
      sremAsync: async (key, id) => calls.push(["srem", key, id]),
    },
    models: { Ban: { deleteMany: (query) => ({
      exec: async () => calls.push(["unban", query.userId, query.type]),
    }) } },
    cacheUserPermissions: async (id) => calls.push(["permissions", id]),
  });
  await leave("stuck");
  assert.deepEqual(calls, [
    ["del", "user:stuck:game"],
    ["srem", "game:gone:players", "stuck"],
    ["unban", "stuck", "gameAuto"],
    ["permissions", "stuck"],
  ]);
});

test("Break Game preserves the original roster for its broken-game record", async () => {
  let saved;
  let deleted;
  const game = { id: "gone", players: ["stuck"], settings: { setup: "setup" } };
  const breakGame = loadFunction("modules/redis.js", "breakGame", "setSpectatorCount", {
    getGameInfo: async () => game,
    client: {
      scanAsync: async () => ["0", ["user:stuck:game"]],
      getAsync: async () => "gone",
    },
    leaveGame: async () => {},
    deleteGame: async (id) => { deleted = id; },
    models: {
      Setup: { findOne: async () => ({ _id: "setup-db-id" }) },
      User: { findOne: () => ({ select: async () => ({ _id: "user-db-id" }) }) },
      Game: function (record) { this.save = async () => { saved = record; }; },
    },
  });
  await breakGame("gone");
  assert.equal(deleted, "gone");
  assert.equal(saved.broken, true);
  assert.equal(saved.id, "gone");
  assert.deepEqual(Array.from(saved.users), ["user-db-id"]);
});

test("a successful server leave clears its timeout", async () => {
  const waiting = {};
  let cleared;
  const leave = loadFunction("modules/gameLoadBalancer.js", "leaveGame", "cancelGame", {
    redis: { inGame: async () => "live", getGamePort: async () => "3010" },
    servers: { 3010: { send: () => {
      const request = waiting.user;
      delete waiting.user;
      request.resolve();
    } } },
    waiting,
    process: { env: {} },
    setTimeout: () => 123,
    clearTimeout: (id) => { cleared = id; },
    logger: { error() {} },
  });
  await leave("user");
  assert.equal(cleared, 123);
  assert.equal(waiting.user, undefined);
});
