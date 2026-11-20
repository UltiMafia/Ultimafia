// Run with NODE_ENV=test mocha test/moderationKick.test.js.
// Production classes, socket wrapper, route and worker callbacks; no worker is
// started. DB/Redis, applied ban permissions and game bootstrap are fixtures.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { EventEmitter, once } = require("node:events");
const WebSocket = require("ws");
const sockets = require("../lib/sockets");
const root = path.resolve(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

function fixture() {
  let id = 0;
  const errors = [];
  const logger = { error: (e) => errors.push(e), info() {} };
  const state = { allowed: true, loggedIn: true, banned: false, sessions: ["target"], playerGame: null };
  const actions = [];
  const redis = {
    inGame: async () => state.playerGame,
    leaveGame: async () => { state.playerGame = null; },
    setSpectatorCount() {}, gameExists: async () => true,
    getUserRank: async () => 0, getGamePort: async () => 3010,
    client: { duplicate: () => ({ subscribe() {}, on() {} }) },
    getAllGameServerPorts: async () => [3010, 3011],
  };
  const routeUtils = {
    nameGen: () => "fixture",
    verifyLoggedIn: async () => {
      if (!state.loggedIn) throw Error("Not logged in");
      return "admin";
    },
    verifyPermission: async (...args) => args.includes("playGame") ? !state.banned : state.allowed,
    createModAction: (...args) => actions.push(args),
  };
  const models = { Session: { deleteMany: () => ({ exec: async () => { state.sessions = []; } }) } };
  const shortid = { generate: () => `id${++id}` };
  const mocks = {
    shortid, "../../routes/utils": routeUtils, "../../modules/redis": redis,
    "../../modules/logging": () => logger, "../../data/constants": {},
    "./History": class {}, "../../modules/pushNotifications": { unregisterUser() {} },
    "./botPlayers": { isGuestPlayer: () => false, isTestBotPlayer: () => false },
  };
  function load(file, extra = {}) {
    const module = { exports: {} };
    // Unexercised game bootstrap/role dependencies are intentionally inert.
    const requireFixture = (key) => key in extra ? extra[key] : mocks[key] || {};
    new Function("require", "module", "exports", source(file))(requireFixture, module, module.exports);
    return module.exports;
  }
  const Player = load("Games/core/Player.js");
  const Spectator = load("Games/core/Spectator.js", { "./Player": Player });
  Spectator.prototype.sendMeetings = function () {};
  const Game = load("Games/core/Game.js", { "./Player": Player, "./Spectator": Spectator, events: EventEmitter });
  function game(name) {
    return Object.assign(Object.create(Game.prototype), {
      id: name, hostId: "host", players: [], spectators: [], spectatorsOld: [], banned: {},
      pregameSpectatorUserIds: new Set(), spectatorHintUserIds: new Set(),
      currentState: 1, started: true, starting: false, spectating: true,
      spectatorLimit: 100, spectatorHistory: {}, events: new EventEmitter(),
      spectatorReconnectGraceMs: 10000, timeouts: [],
      sendAllGameInfo() {}, broadcastSpectators() {},
      canSpectateOmnisciently: async () => false,
      sendSpectatorJoinHint: async () => {},
    });
  }
  function user(name = "target", socket) {
    if (!socket) {
      const raw = new EventEmitter();
      raw.readyState = 1;
      raw.frames = [];
      raw.send = (message) => raw.frames.push(message);
      raw.terminate = () => { raw.readyState = 3; raw.emit("close"); };
      socket = new sockets.ServerSocket(raw);
    }
    return { id: name, name, socket, settings: {}, send: (...args) => socket.send(...args), disconnect: () => socket.terminate() };
  }
  function slice(file, start, end, context) {
    const text = source(file);
    const first = text.indexOf(start);
    const last = text.indexOf(end, first + start.length);
    assert(first >= 0 && last > first, `handler boundaries: ${file} ${start}`);
    vm.runInNewContext(text.slice(first, last), context, { filename: file });
  }
  const games = { a: game("a"), b: game("b") };
  const workers = {};
  for (const [port, name] of [[3010, "a"], [3011, "b"]]) {
    const handlers = {};
    const socket = { isServer: true, on: (event, handler) => { handlers[event] = handler; } };
    const context = { socket, games: { [name]: games[name] }, redis, logger };
    slice("Games/games.js", 'socket.on("leaveGame",', "// The main server removing", context);
    slice("Games/games.js", 'socket.on("kickSpectator",', 'socket.on("devControl",', context);
    workers[port] = { socket, handlers };
  }
  class LBClient {
    constructor(url) {
      this.port = Number(url.split(":").pop());
      this.handlers = {};
      workers[this.port].socket.send = (event, data) => this.handlers[event]?.(data);
    }
    on(event, handler) { this.handlers[event] = handler; }
    send(event, data) { workers[this.port].handlers[event]?.(data); }
  }
  const lb = load("modules/gameLoadBalancer.js", {
    shortid, "../lib/sockets": { ClientSocket: LBClient },
    "./redis": redis, "./logging": () => logger,
  });
  function route(name, balancer = lb) {
    let handler;
    const router = { post: (_path, action) => { handler = action; } };
    slice("routes/mod.js", `router.post("/${name}",`, "\nrouter.post(", {
      router, routeUtils, redis, models, gameLoadBalancer: balancer, logger,
      errors: { serverError: (res) => { res.code = 500; } }, String,
    });
    return handler;
  }
  function join(user, game) {
    const handlers = {};
    const socket = user.socket;
    const on = socket.on.bind(socket);
    socket.on = (event, handler) => { handlers[event] = handler; on(event, handler); };
    slice("Games/games.js", 'socket.on("join",', "// Push subscription", {
      socket, user, games: { [game.id]: game }, redis, logger, shortid, constants: {}, port: 3010,
    });
    socket.on = on;
    return handlers.join;
  }
  async function authenticateBanned(socket) {
    let handler;
    const authSocket = { on: (_event, action) => { handler = action; } };
    redis.authenticateToken = async () => "target";
    models.User = { findOne: () => ({ select: () => ({ populate: async () => ({ id: "target" }) }) }) };
    // Use the real auth callback, with a controlled token and User query.
    slice("Games/games.js", 'socket.on("auth",', 'socket.on("join",', {
      socket: Object.assign(authSocket, { send: socket.send.bind(socket), terminate: socket.terminate.bind(socket) }),
      redis, models, routeUtils, constants: {}, logger, user: null,
    });
    await handler("fixture-token");
  }
  const response = () => ({ code: null, sendStatus(code) { this.code = code; } });
  const kick = route("kick");
  return { state, games, user, route, join, response, kick, workers, actions, errors, redis, authenticateBanned };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
const frames = (user, event) => user.socket.socket.frames.filter((frame) => frame === event || frame.startsWith(`${event}:`));

describe("Moderation kick connection lifecycle", function () {
  it("revokes banned, forcibly signed-out spectators on every worker", async function () {
    const f = fixture();
    await tick(); // load-balancer worker discovery
    const first = f.user(), second = f.user(), other = f.user("other");
    f.join(first, f.games.a); // production join listener with cached authenticated User
    f.games.a.addSpectator(first);
    f.games.b.addSpectator(second);
    f.games.a.addSpectator(other);
    f.state.banned = true; // applied site-ban permission seam, not the ban route
    await f.route("logout")({ body: { userId: "target" } }, f.response());
    assert.equal(f.state.sessions.length, 0);
    f.games.a.broadcast("probe", "before kick");
    assert.equal(frames(first, "probe").length, 1);
    const res = f.response();
    await f.kick({ body: { userId: "target" } }, res);
    assert.equal(res.code, 200);
    assert.equal(f.games.a.findSpectator(first), null);
    assert.equal(f.games.b.findSpectator(second), null);
    assert(f.games.a.findSpectator(other));
    assert.equal(first.socket.readyState, 3, "kicked spectator transport must close");
    assert.equal(second.socket.readyState, 3);
    const before = frames(first, "probe").length;
    f.games.a.broadcast("probe", "after kick");
    assert.equal(frames(first, "probe").length, before);
    let timerRequests = 0;
    f.games.a.resendTimers = () => timerRequests++;
    // Ignore left and try buffered frames on the old transport. No data or rejoin.
    first.socket.socket.emit("message", 'join:object:{"gameId":"a","spectate":true}');
    first.socket.socket.emit("message", "getTimerInfo");
    await tick();
    assert.equal(timerRequests, 0);
    assert.equal(f.games.a.findSpectator(first), null);
    const fresh = f.user();
    await f.authenticateBanned(fresh.socket);
    assert.equal(fresh.socket.readyState, 3, "a fresh connection must pass the existing ban gate");
    assert.equal(frames(fresh, "banned").length, 1);
    assert.equal(f.actions.at(-1)[1], "Kick Player");
    assert.equal(f.errors.length, 0);
  });

  for (const loggedIn of [true, false]) {
    it(`rejects an ${loggedIn ? "unauthorized" : "unauthenticated"} admin kick without side effects`, async function () {
      const f = fixture();
      await tick();
      const target = f.user();
      const spectator = f.games.a.addSpectator(target);
      f.state.loggedIn = loggedIn;
      f.state.allowed = false;
      const res = f.response();
      await f.kick({ body: { userId: "target" } }, res);
      assert.notEqual(res.code, 200);
      assert.equal(f.games.a.findSpectator(target), spectator);
      assert.equal(target.socket.readyState, 1);
      assert.equal(f.actions.length, 0);
    });
  }

  it("does not accept a worker kick from a non-server connection", async function () {
    const f = fixture();
    await tick();
    const target = f.user();
    const spectator = f.games.a.addSpectator(target);
    const worker = f.workers[3010];
    worker.socket.isServer = false;
    worker.handlers.kickSpectator({ userId: "target" });
    assert.equal(f.games.a.findSpectator(target), spectator);
    assert.equal(target.socket.readyState, 1);
    assert.match(f.errors[0].message, /Not authenticated as server/);
  });

  it("preserves the existing player leave path while revoking the same account's spectator", async function () {
    const f = fixture();
    await tick();
    const playerUser = f.user(), spectatorUser = f.user();
    const player = { id: "p", user: playerUser, left: false, alive: false, send: playerUser.send };
    f.games.a.players.push(player);
    f.games.a.kudosVoterLeft = () => {};
    f.games.a.sendAlert = () => {};
    f.games.b.addSpectator(spectatorUser);
    f.state.playerGame = "a";
    const res = f.response();
    await f.kick({ body: { userId: "target" } }, res);
    assert.equal(res.code, 200);
    assert.equal(player.left, true);
    assert.equal(f.state.playerGame, null);
    assert.equal(frames(playerUser, "left").length, 1);
    assert.equal(spectatorUser.socket.readyState, 3);
    // Existing player teardown deliberately waits 100ms to flush left.
    await new Promise((resolve) => setTimeout(resolve, 130));
    assert.equal(playerUser.socket.readyState, 3);
    assert.equal(f.errors.length, 0);
  });

  it("still kicks spectators if the existing player leave request fails", async function () {
    const f = fixture();
    await tick();
    const target = f.user();
    f.games.a.addSpectator(target);
    const handler = f.route("kick", {
      leaveGame: async () => { throw Error("worker unavailable"); },
      kickSpectator: () => f.workers[3010].handlers.kickSpectator({ userId: "target" }),
    });
    const res = f.response();
    await handler({ body: { userId: "target" } }, res);
    assert.equal(res.code, 200);
    assert.equal(target.socket.readyState, 3);
  });

  it("clears reconnect grace without scheduling another removal on kick", async function () {
    const f = fixture();
    const target = f.user();
    const spectator = f.games.a.addSpectator(target);
    f.games.a.scheduleSpectatorRemoval(spectator, target.socket);
    assert(spectator.reconnectTimer);
    f.games.a.kickSpectator(spectator);
    assert.equal(spectator.reconnectTimer, null);
    assert.equal(f.games.a.spectators.length, 0);
    assert.equal(f.games.a.pregameSpectatorUserIds.has("target"), false);
    assert.equal(target.socket.listeners.getTimerInfo, undefined);
    f.games.a.kickSpectator(spectator); // repeated/late worker delivery is harmless
    assert.equal(target.socket.readyState, 3);
  });

  for (const permanent of [false, true]) {
    it(`preserves ${permanent ? "permanent host ban" : "nonpermanent kick"} semantics`, async function () {
      const f = fixture();
      const target = f.user();
      const spectator = f.games.a.addSpectator(target);
      f.games.a.kickSpectator(spectator, permanent);
      assert.equal(target.socket.readyState, 3);
      assert.equal(!!f.games.a.banned.target, permanent);
      const fresh = f.user();
      const refusal = await f.games.a.spectatorJoinRefusal(fresh, false);
      assert.equal(refusal, permanent ? "You are banned from this game." : null);
      if (!permanent) {
        await f.games.a.userJoin(fresh, { spectate: true });
        assert(f.games.a.findSpectator(fresh));
        assert.equal(fresh.socket.readyState, 1);
      }
    });
  }

  it("revokes the current reconnect owner, not just the replaced socket", function () {
    const f = fixture();
    const oldUser = f.user(), fresh = f.user();
    const spectator = f.games.a.addSpectator(oldUser);
    f.games.a.reconnectSpectator(spectator, fresh, false);
    assert.equal(spectator.socket, fresh.socket);
    f.games.a.kickSpectator(spectator);
    assert.equal(fresh.socket.readyState, 3);
    assert.equal(f.games.a.spectators.length, 0);
    assert.equal(f.errors.length, 0);
  });

  for (const [existing, stage, pregame] of [
    [false, "omniscient", false], [true, "omniscient", false],
    [false, "refusal", false], [false, "refusal", true],
  ]) {
    it(`does not finish an in-flight spectator ${existing ? "reconnect" : "join"} after ${stage} I/O (${pregame ? "pregame" : "started"}) on a kicked socket`, async function () {
      const f = fixture();
      const target = f.user();
      const spectator = f.games.a.addSpectator(target);
      let resume;
      let reached;
      const waiting = new Promise((resolve) => { reached = resolve; });
      if (pregame) {
        f.games.a.started = false;
        f.games.a.currentState = -1;
      }
      const method = stage === "omniscient" ? "canSpectateOmnisciently" : "spectatorJoinRefusal";
      f.games.a[method] = () => {
        reached();
        return new Promise((resolve) => { resume = resolve; });
      };
      if (!existing) {
        // Start a join without an entry, then let another packet add it before
        // the admin kick. The suspended packet must not recreate the entry.
        f.games.a.removeSpectator(spectator);
      }
      const joining = f.games.a.userJoin(target, { spectate: true });
      await waiting;
      if (!existing) f.games.a.addSpectator(target);
      let bootstraps = 0;
      f.games.a.sendAllGameInfo = () => bootstraps++;
      f.games.a.kickSpectator(f.games.a.findSpectator(target));
      resume(false);
      await joining;
      assert.equal(f.games.a.findSpectator(target), null);
      assert.equal(bootstraps, 0, "revoked socket must not regain game ownership");
      assert.equal(target.socket.listeners.getTimerInfo, undefined);
      assert.equal(f.errors.length, 0);
    });
  }

  it("closes an actual WebSocket even when the client ignores left", async function () {
    this.timeout(5000);
    const f = fixture();
    const server = new WebSocket.Server({ host: "127.0.0.1", port: 0 });
    await once(server, "listening");
    const connected = once(server, "connection");
    const client = new WebSocket(`ws://127.0.0.1:${server.address().port}`);
    const messages = [];
    client.on("message", (frame) => messages.push(String(frame)));
    try {
      const [raw] = await connected;
      const target = f.user("target", new sockets.ServerSocket(raw));
      f.join(target, f.games.a);
      const spectator = f.games.a.addSpectator(target);
      await once(client, "open");
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(Error("kicked WebSocket remained open")), 1000);
        client.once("close", () => { clearTimeout(timeout); resolve(); });
        f.games.a.kickSpectator(spectator);
      });
      const count = messages.length;
      f.games.a.broadcast("probe", "forbidden");
      await tick();
      assert.equal(client.readyState, WebSocket.CLOSED);
      assert.equal(messages.length, count);
      assert.equal(target.socket.listeners.join, undefined);
      assert.equal(f.games.a.findSpectator(target), null);
    } finally {
      client.terminate();
      for (const socket of server.clients) socket.terminate();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
