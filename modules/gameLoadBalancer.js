const shortid = require("shortid");
const sockets = require("../lib/sockets");
const redis = require("./redis");
const logger = require("./logging")(".");
const subscriber = redis.client.duplicate();

var gameServerPorts = [];
var servers = {};
var waiting = {};

(async function () {
  try {
    gameServerPorts = await redis.getAllGameServerPorts();

    for (let i = 0; i < gameServerPorts.length; i++)
      establishGameConn(gameServerPorts[i]);

    subscriber.subscribe("gamePorts", "deprecate");

    subscriber.on("message", (chan, port) => {
      if (chan == "gamePorts") establishGameConn(port);
      else if (chan == "deprecate") deprecateServer(port);
    });
  } catch (e) {
    logger.error(e);
  }
})();

function establishGameConn(port) {
  const previousSocket = servers[port];
  let socket = new sockets.ClientSocket(`ws://localhost:${port}`, true);
  servers[port] = socket;
  socket.canCreateGames = false;
  socket.deprecated = false;
  // Each replacement starts with its own readiness state.
  if (previousSocket) previousSocket.terminate();

  socket.on("connected", (capabilities) => {
    socket.canCreateGames = false;
    socket.send("authAsServer", process.env.LOAD_BALANCER_KEY);
    // Old games processes do not acknowledge authentication. WebSocket ordering
    // delivers authAsServer before any createGame, which still checks isServer.
    if (!capabilities || !capabilities.serverAuthentication) markReady();
  });

  function markReady() {
    if (servers[port] === socket && !socket.deprecated && socket.readyState === 1) {
      socket.canCreateGames = true;
    }
  }

  socket.on("serverAuthenticated", markReady);

  socket.on("disconnected", () => {
    // Keep discovery across transient disconnects, including a www restart.
    // Explicit deprecation remains responsible for removing registration.
    socket.canCreateGames = false;
  });

  socket.on("gameCreated", (gameId) => {
    const gameResults = waiting[gameId];
    if (!gameResults || gameResults.socket !== socket) return;

    gameResults.resolve(gameId);
  });

  socket.on("gameCreateError", (info) => {
    const gameResults = waiting[info.gameId];
    if (!gameResults || gameResults.socket !== socket) return;

    gameResults.reject(new Error(info.error));
  });

  socket.on("devControlResult", (info) => {
    const results = waiting[info.requestId];
    if (!results) return;

    delete waiting[info.requestId];
    if (info.ok) results.resolve(info.result);
    else results.reject(new Error(info.error));
  });

  socket.on("gameLeft", (userId) => {
    const leaveResults = waiting[userId];
    if (!leaveResults) return;

    delete waiting[userId];
    leaveResults.resolve();
  });

  socket.on("gameLeaveError", (info) => {
    const leaveResults = waiting[info.userId];
    if (!leaveResults) return;

    delete waiting[info.userId];
    leaveResults.reject(new Error(info.error));
  });
}

async function createGame(hostId, gameType, settings) {
  const preferredPort = await redis.getNextGameServerPort();
  const registeredPorts = await redis.getAllGameServerPorts();
  const ready = (socket) =>
    socket && socket.readyState === 1 && socket.canCreateGames && !socket.deprecated;
  // Only use ports still registered, the next port included: a games process
  // removes its registration on close without a deprecate event, while its
  // socket is open, and that can happen between the two reads above.
  const candidates = registeredPorts.includes(preferredPort)
    ? [preferredPort, ...registeredPorts]
    : registeredPorts;
  const port = candidates.find((port) => ready(servers[port]));
  const socket = servers[port];

  if (!socket) throw new Error("No game server is ready to host a game.");

  const gameId = shortid.generate();
  return new Promise((resolve, reject) => {
    let timeout;
    const finish = (error) => {
      if (waiting[gameId] !== request) return;
      delete waiting[gameId];
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(gameId);
    };
    const request = {
      socket,
      resolve: () => finish(),
      reject: finish,
    };
    waiting[gameId] = request;
    timeout = setTimeout(
      () => finish(new Error("Timeout creating game on game server")),
      Number(process.env.GAME_CREATION_TIMEOUT)
    );

    try {
      // Never queue creation across reconnect or retry after a possible delivery.
      if (!ready(socket)) throw new Error("Game server disconnected before hosting.");
      socket.send("createGame", {
        gameId,
        key: process.env.LOAD_BALANCER_KEY,
        hostId,
        gameType,
        settings,
      });
    } catch (error) {
      finish(error);
    }
  });
}

async function leaveGame(userId) {
  return new Promise(async (res, rej) => {
    try {
      const gameId = await redis.inGame(userId);

      if (!gameId) {
        res();
        return;
      }

      const port = await redis.getGamePort(gameId);

      if (!port) {
        await redis.leaveGame(userId);
        res();
        return;
      }

      waiting[userId] = {
        resolve: res,
        reject: rej,
      };

      const leaveRequest = waiting[userId];
      const timeout = setTimeout(() => {
        if (waiting[userId] !== leaveRequest) return;
        delete waiting[userId];
        rej(new Error("Timeout leaving game on game server"));
      }, 10000);
      leaveRequest.resolve = () => {
        clearTimeout(timeout);
        res();
      };
      leaveRequest.reject = (error) => {
        clearTimeout(timeout);
        rej(error);
      };

      try {
        servers[port].send("leaveGame", {
          userId: userId,
          key: process.env.LOAD_BALANCER_KEY,
        });
      } catch (e) {
        delete waiting[userId];
        leaveRequest.reject(e);
      }
    } catch (e) {
      logger.error(e);
      rej(e);
    }
  });
}

async function cancelGame(userId, gameId) {
  return new Promise(async (res, rej) => {
    try {
      const port = await redis.getGamePort(gameId);

      waiting[userId] = {
        resolve: res,
        reject: rej,
      };

      servers[port].send("cancelGame", {
        gameId: gameId,
        userId: userId,
        key: process.env.LOAD_BALANCER_KEY,
      });
    } catch (e) {
      logger.error(e);
      rej(e);
    }
  });
}

async function devControl(gameId, command, args) {
  const port = await redis.getGamePort(gameId);
  if (!port || !servers[port]) throw new Error("Game not found.");

  const requestId = `devControl:${shortid.generate()}`;
  return new Promise((resolve, reject) => {
    waiting[requestId] = { resolve, reject };
    servers[port].send("devControl", { requestId, gameId, command, args });
    setTimeout(() => {
      if (!waiting[requestId]) return;
      delete waiting[requestId];
      reject(new Error("Timeout waiting for the game server."));
    }, 10000);
  });
}

// Tell the game server holding `oldGameId` (still in postgame) that it was
// rehosted, so it can invite the players left in it. Fire-and-forget.
async function notifyRehost(oldGameId, newGameId, { hostId, hostName, setup } = {}) {
  const port = await redis.getGamePort(oldGameId);
  if (!port || !servers[port]) return false;

  servers[port].send("gameRehosted", {
    key: process.env.LOAD_BALANCER_KEY,
    gameId: oldGameId,
    newGameId,
    hostId,
    hostName,
    setup: setup || null,
  });
  return true;
}

async function deprecateServer(port) {
  if (servers[port]) {
    servers[port].deprecated = true;
    servers[port].canCreateGames = false;
  }
  await redis.removeGameServer(port);
  servers[port].send("deprecated", {
    key: process.env.LOAD_BALANCER_KEY,
  });
}

module.exports = {
  createGame,
  leaveGame,
  cancelGame,
  notifyRehost,
  devControl,
  deprecateServer,
};
