const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

async function fixture(preferred = 3010, registered = new Set([3010, 3011])) {
  const connections = [];
  const timers = new Map();
  const errors = [];
  const subscriber = {
    subscribe() {},
    on(name, handler) { this[name] = handler; },
  };
  class ClientSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1;
      this.handlers = {};
      this.messages = [];
      connections.push(this);
    }
    on(name, handler) { this.handlers[name] = handler; }
    emit(name, data) { this.handlers[name]?.(data); }
    send(name, data) {
      if (this.failSend && name === "createGame") throw new Error("send failed");
      this.messages.push({ name, data });
    }
    terminate() { this.readyState = 3; this.emit("disconnected"); }
  }
  let nextId = 0;
  const redis = {
    client: { duplicate: () => subscriber },
    getAllGameServerPorts: async () => [...registered],
    getNextGameServerPort: async () => preferred,
    registerGameServer: async (port) => { registered.add(Number(port)); },
    removeGameServer: async (port) => { registered.delete(Number(port)); },
  };
  const context = {
    module: { exports: {} },
    process: { env: { LOAD_BALANCER_KEY: "fixture", GAME_CREATION_TIMEOUT: "1000" } },
    require(name) {
      if (name === "shortid") return { generate: () => `game-${++nextId}` };
      if (name === "../lib/sockets") return { ClientSocket };
      if (name === "./redis") return redis;
      if (name === "./logging") return () => ({ error(error) { errors.push(error); } });
      throw new Error(`Unexpected dependency: ${name}`);
    },
    setTimeout(fn) { const id = {}; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../modules/gameLoadBalancer.js"), "utf8"),
    context
  );
  // A promise from this realm takes extra ticks to settle inside the vm context.
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  await settle();
  const authenticate = (socket) => {
    socket.emit("connected");
    socket.emit("serverAuthenticated");
  };
  const start = async () => {
    const promise = context.module.exports.createGame("host", "Mafia", {});
    // Capture the rejection before advancing a simulated timer.
    const result = promise.then(
      (value) => ({ value }),
      (error) => ({ error })
    );
    await settle();
    return { result };
  };
  return { api: context.module.exports, connections, timers, context, authenticate,
    start, registered, redis, subscriber, errors, settle };
}

describe("Game hosting server selection and request cleanup", function () {
  it("removes a disconnected authenticated server from discovery", async function () {
    const f = await fixture();
    f.authenticate(f.connections[0]);
    f.connections[0].terminate();
    await f.settle();
    assert.equal(f.registered.has(3010), false);
    assert.equal(f.registered.has(3011), true);
  });

  it("removes a refused connection even if it never authenticated", async function () {
    const f = await fixture();
    f.connections[0].terminate();
    await f.settle();
    assert.equal(f.registered.has(3010), false);
    const restarted = await fixture(3010, f.registered);
    assert.deepEqual(restarted.connections.map((socket) => socket.url), ["ws://localhost:3011"]);
  });

  it("restores discovery only after a reconnected server authenticates", async function () {
    const f = await fixture();
    const socket = f.connections[0];
    f.authenticate(socket);
    socket.terminate();
    await f.settle();
    assert.equal(f.registered.has(3010), false);
    socket.readyState = 1;
    socket.emit("connected");
    assert.equal(f.registered.has(3010), false);
    socket.emit("serverAuthenticated");
    await f.settle();
    assert.equal(f.registered.has(3010), true);
    const restarted = await fixture(3010, f.registered);
    assert.ok(restarted.connections.some((connection) => connection.url === "ws://localhost:3010"));
    restarted.authenticate(restarted.context.servers[3010]);
    const { result } = await restarted.start();
    const sent = restarted.context.servers[3010].messages.find((message) => message.name === "createGame");
    restarted.context.servers[3010].emit("gameCreated", sent.data.gameId);
    assert.equal((await result).value, sent.data.gameId);
  });

  it("does not remove a replacement when terminating the old connection", async function () {
    const f = await fixture();
    const old = f.connections[0];
    f.authenticate(old);
    f.subscriber.message("gamePorts", "3010");
    await f.settle();
    assert.notEqual(f.context.servers[3010], old);
    assert.equal(f.registered.has(3010), true);
    old.emit("disconnected");
    await f.settle();
    assert.equal(f.registered.has(3010), true);
    f.context.servers[3010].terminate();
    await f.settle();
    assert.equal(f.registered.has(3010), false);
    old.readyState = 1;
    f.authenticate(old);
    await f.settle();
    assert.equal(f.registered.has(3010), false);
  });

  it("does not restore a deprecated server or accept auth after close", async function () {
    const f = await fixture();
    const socket = f.connections[0];
    f.authenticate(socket);
    await f.api.deprecateServer(3010);
    socket.terminate();
    socket.readyState = 1;
    f.authenticate(socket);
    await f.settle();
    assert.equal(f.registered.has(3010), false);
    const other = f.connections[1];
    other.terminate();
    other.emit("serverAuthenticated");
    await f.settle();
    assert.equal(f.registered.has(3011), false);
  });

  it("logs Redis update failures without an unhandled rejection", async function () {
    const f = await fixture();
    f.redis.registerGameServer = async () => { throw new Error("register failed"); };
    f.redis.removeGameServer = async () => { throw new Error("remove failed"); };
    f.authenticate(f.connections[0]);
    f.connections[0].terminate();
    await f.settle();
    assert.deepEqual(f.errors.map((error) => error.message), ["register failed", "remove failed"]);
  });

  it("does not send creation before authentication", async function () {
    const f = await fixture();
    const { result } = await f.start();
    assert.match((await result).error.message, /No game server is ready/);
    assert.equal(f.connections.flatMap((s) => s.messages).length, 0);
    assert.equal(f.timers.size, 0);
  });

  it("uses an authenticated alternate when the preferred server is closed", async function () {
    const f = await fixture();
    f.authenticate(f.connections[0]);
    f.authenticate(f.connections[1]);
    f.connections[0].readyState = 3;
    const { result } = await f.start();
    const sent = f.connections[1].messages.find((m) => m.name === "createGame");
    assert.ok(sent);
    f.connections[1].emit("gameCreated", sent.data.gameId);
    assert.equal((await result).value, sent.data.gameId);
    assert.equal(f.timers.size, 0);
    assert.equal(Object.keys(f.context.waiting).length, 0);
  });

  it("handles an absent preferred server without a hardcoded fallback", async function () {
    const f = await fixture(9999);
    f.authenticate(f.connections[1]);
    const { result } = await f.start();
    const sent = f.connections[1].messages.find((m) => m.name === "createGame");
    f.connections[1].emit("gameCreated", sent.data.gameId);
    assert.equal((await result).value, sent.data.gameId);
  });

  it("cleans a synchronous send failure without retrying another server", async function () {
    const f = await fixture();
    f.connections.forEach(f.authenticate);
    f.connections[0].failSend = true;
    const { result } = await f.start();
    assert.match((await result).error.message, /send failed/);
    assert.equal(f.timers.size, 0);
    assert.equal(Object.keys(f.context.waiting).length, 0);
    assert.equal(f.connections[1].messages.some((m) => m.name === "createGame"), false);
  });

  it("cleans explicit creation errors", async function () {
    const f = await fixture();
    f.authenticate(f.connections[0]);
    const { result } = await f.start();
    f.connections[0].emit("gameCreateError", { gameId: "game-1", error: "invalid setup" });
    assert.match((await result).error.message, /invalid setup/);
    assert.equal(f.timers.size, 0);
    assert.equal(Object.keys(f.context.waiting).length, 0);
  });

  it("ignores another connection's reply and a late reply after timeout", async function () {
    const f = await fixture();
    f.connections.forEach(f.authenticate);
    const { result } = await f.start();
    f.connections[1].emit("gameCreated", "game-1");
    assert.equal(Object.keys(f.context.waiting).length, 1);
    [...f.timers.values()][0]();
    assert.match((await result).error.message, /Timeout creating/);
    f.connections[0].emit("gameCreated", "game-1");
    assert.equal(Object.keys(f.context.waiting).length, 0);
    assert.equal(f.timers.size, 0);
    assert.equal(f.connections.flatMap((s) => s.messages).filter((m) => m.name === "createGame").length, 1);
  });

  it("requires fresh authentication after disconnect", async function () {
    const f = await fixture();
    f.authenticate(f.connections[0]);
    f.connections[0].emit("disconnected");
    f.connections[0].emit("connected");
    const { result } = await f.start();
    assert.match((await result).error.message, /No game server is ready/);
  });

  it("does not select deprecated servers even after a new auth reply", async function () {
    const f = await fixture();
    f.authenticate(f.connections[0]);
    await f.api.deprecateServer(3010);
    f.connections[0].emit("serverAuthenticated");
    const { result } = await f.start();
    assert.match((await result).error.message, /No game server is ready/);
  });
});
