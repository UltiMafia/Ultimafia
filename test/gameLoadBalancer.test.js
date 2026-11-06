const { expect } = require("chai");
const { EventEmitter, once } = require("events");
const WebSocket = require("ws");
const sockets = require("../lib/sockets");

describe("Game load balancer recovery", function () {
  this.timeout(5000);
  let server, port, registry, clients, subscribers, restore, options, creations;
  let savedEnv;

  async function startWebsite() {
    const paths = ["../modules/gameLoadBalancer", "../modules/redis", "../modules/logging"]
      .map(require.resolve);
    const previous = paths.map((path) => require.cache[path]);
    const redis = {
      client: { duplicate() {
        const subscriber = new EventEmitter();
        subscriber.subscribe = () => {};
        subscribers.push(subscriber);
        return subscriber;
      } },
      getAllGameServerPorts: async () => [...registry],
      getNextGameServerPort: async () => [...registry][0],
      registerGameServer: async (value) => { registry.add(Number(value)); },
      removeGameServer: async (value) => { registry.delete(Number(value)); },
    };
    const exports = [null, redis, () => ({ error(error) { throw error; } })];
    paths.forEach((path, index) => {
      if (index === 0) delete require.cache[path];
      else require.cache[path] = { id: path, filename: path, loaded: true, exports: exports[index] };
    });
    let balancer;
    try {
      balancer = require("../modules/gameLoadBalancer");
      // Complete the startup Redis snapshot and connection creation.
      await new Promise(setImmediate);
    } finally {
      paths.forEach((path, index) => {
        if (previous[index]) require.cache[path] = previous[index];
        else delete require.cache[path];
      });
    }
    return balancer;
  }

  async function waitFor(predicate) {
    const deadline = Date.now() + 2000;
    while (!predicate()) {
      if (Date.now() >= deadline) throw new Error("Timed out waiting for socket state");
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  beforeEach(async function () {
    options = { modern: true, acknowledge: true, greet: true };
    clients = [];
    subscribers = [];
    creations = [];
    savedEnv = { ...process.env };
    process.env.LOAD_BALANCER_KEY = "load-balancer-test";
    process.env.GAME_CREATION_TIMEOUT = "1000";
    process.env.SERVER_SOCKET_PING_INTERVAL = "60000";

    // Real transport, with only game construction and Redis persistence replaced.
    // The legacy branch uses the pre-PR connected/authAsServer wire protocol.
    server = new WebSocket.Server({ port: 0 });
    await once(server, "listening");
    port = server.address().port;
    registry = new Set([port]);
    server.on("connection", (peer) => {
      const socket = new sockets.ServerSocket(peer);
      if (options.greet)
        socket.send("connected", options.modern ? { serverAuthentication: true } : undefined);
      socket.on("authAsServer", (key) => {
        if (key !== process.env.LOAD_BALANCER_KEY) return;
        socket.isServer = true;
        if (options.modern && options.acknowledge) socket.send("serverAuthenticated");
      });
      socket.on("createGame", (data) => {
        if (!socket.isServer) {
          socket.send("gameCreateError", { gameId: data.gameId, error: "Not authenticated as server" });
          return;
        }
        creations.push(data);
        socket.send("gameCreated", data.gameId);
      });
    });
    const ClientSocket = sockets.ClientSocket;
    sockets.ClientSocket = class extends ClientSocket {
      constructor(...args) {
        super(...args);
        clients.push(this);
      }
    };
    restore = () => { sockets.ClientSocket = ClientSocket; };
  });

  afterEach(async function () {
    clients.forEach((client) => client.clear());
    subscribers.forEach((subscriber) => subscriber.removeAllListeners());
    server.clients.forEach((peer) => peer.terminate());
    await new Promise((resolve) => server.close(resolve));
    restore();
    for (const key of ["LOAD_BALANCER_KEY", "GAME_CREATION_TIMEOUT", "SERVER_SOCKET_PING_INTERVAL"]) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  it("rediscovers a disconnected game server after www restarts before reconnect", async function () {
    const firstWebsite = await startWebsite();
    const firstSocket = clients[0];
    await waitFor(() => firstSocket.canCreateGames);
    await firstWebsite.createGame("host", "Mafia", {});

    // Stop reconnecting as the old www exits; the game server stays running.
    firstSocket.persistent = false;
    const disconnected = once(firstSocket.socket, "close");
    server.clients.forEach((peer) => peer.terminate());
    await disconnected;
    await new Promise(setImmediate);
    expect(firstSocket.canCreateGames).to.equal(false);
    await expectUnavailable(firstWebsite);
    firstSocket.clear();

    // Fresh module state can discover only what remains in the registry.
    const secondWebsite = await startWebsite();
    expect(clients).to.have.length(2);
    expect(registry.has(port)).to.equal(true);
    await waitFor(() => clients[1].canCreateGames);
    const gameId = await secondWebsite.createGame("host-after-restart", "Mafia", {});
    expect(creations.map((game) => game.hostId)).to.deep.equal(["host", "host-after-restart"]);
    expect(creations[1].gameId).to.equal(gameId);
  });

  async function expectUnavailable(balancer) {
    try {
      await balancer.createGame("host", "Mafia", {});
    } catch (error) {
      expect(error.message).to.equal("No game server is ready to host a game.");
      return;
    }
    throw new Error("Hosting unexpectedly succeeded");
  }

  it("hosts on an old games process that never sends serverAuthenticated", async function () {
    options.modern = false;
    const balancer = await startWebsite();
    await waitFor(() => clients[0].canCreateGames);
    const gameId = await balancer.createGame("legacy-host", "Mafia", {});
    expect(creations).to.have.length(1);
    expect(creations[0].gameId).to.equal(gameId);
  });

  it("waits for authentication when the game server advertises acknowledgements", async function () {
    options.acknowledge = false;
    const balancer = await startWebsite();
    await waitFor(() => clients[0].received.some((message) => message.eventName === "connected"));
    await expectUnavailable(balancer);
    server.clients.forEach((peer) => peer.send("serverAuthenticated"));
    await waitFor(() => clients[0].canCreateGames);
    await balancer.createGame("host", "Mafia", {});
    expect(creations).to.have.length(1);
  });

  it("skips an unready preferred port and hosts on a ready socket", async function () {
    const stale = new WebSocket.Server({ port: 0 });
    await once(stale, "listening");
    try {
      registry = new Set([stale.address().port, port]);
      const balancer = await startWebsite();
      await waitFor(() => clients[1].canCreateGames);
      await balancer.createGame("host", "Mafia", {});
      expect(creations).to.have.length(1);
      expect(clients[0].canCreateGames).to.equal(false);
    } finally {
      clients.forEach((client) => client.clear());
      stale.clients.forEach((peer) => peer.terminate());
      await new Promise((resolve) => stale.close(resolve));
    }
  });

  it("never hosts on a ready socket whose port left the registry without deprecation", async function () {
    // A games worker's onClose removes its registration before it exits,
    // without a deprecate event; its socket can still be open and ready.
    const replacement = new WebSocket.Server({ port: 0 });
    await once(replacement, "listening");
    const peers = [];
    replacement.on("connection", (peer) => peers.push(new sockets.ServerSocket(peer)));
    try {
      registry = new Set([port, replacement.address().port]);
      const balancer = await startWebsite();
      await waitFor(() =>
        clients[0].received.some((message) => message.eventName === "serverAuthenticated") &&
        peers.length === 1
      );
      registry.delete(port);

      let failure;
      try {
        await balancer.createGame("host", "Mafia", {});
      } catch (error) {
        failure = error;
      }
      expect(creations).to.have.length(0);
      expect(failure && failure.message).to.equal("No game server is ready to host a game.");

      // Hosting resumes on the registered replacement once it is ready.
      const hosted = [];
      peers[0].on("createGame", (data) => {
        hosted.push(data);
        peers[0].send("gameCreated", data.gameId);
      });
      peers[0].send("connected", { serverAuthentication: true });
      peers[0].send("serverAuthenticated");
      await waitFor(() => clients[1].canCreateGames);
      const gameId = await balancer.createGame("host", "Mafia", {});
      expect(hosted.map((game) => game.gameId)).to.deep.equal([gameId]);
      expect(creations).to.have.length(0);
    } finally {
      clients.forEach((client) => client.clear());
      replacement.clients.forEach((peer) => peer.terminate());
      await new Promise((resolve) => replacement.close(resolve));
    }
  });

  it("removes an explicitly deprecated port and ignores later authentication replies", async function () {
    const balancer = await startWebsite();
    await waitFor(() => clients[0].canCreateGames);
    await balancer.deprecateServer(port);
    expect(registry.has(port)).to.equal(false);
    server.clients.forEach((peer) => peer.send("serverAuthenticated"));
    await new Promise(setImmediate);
    await expectUnavailable(balancer);
    expect(registry.has(port)).to.equal(false);
  });
});
