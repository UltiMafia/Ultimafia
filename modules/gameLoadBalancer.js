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
  if (servers[port]) servers[port].terminate();

  let socket = new sockets.ClientSocket(`ws://localhost:${port}`, true);
  servers[port] = socket;

  socket.on("connected", () => {
    socket.send("authAsServer", process.env.LOAD_BALANCER_KEY);
  });

  socket.on("gameCreated", (gameId) => {
    const gameResults = waiting[gameId];
    if (!gameResults) return;

    delete waiting[gameId];
    gameResults.resolve(gameId);
  });

  socket.on("gameCreateError", (info) => {
    const gameResults = waiting[info.gameId];
    if (!gameResults) return;

    delete waiting[info.gameId];
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

function createGame(hostId, gameType, settings) {
  return new Promise(async (res, rej) => {
    try {
      const gameId = shortid.generate();
      let portForNextGame = await redis.getNextGameServerPort();

      if (isNaN(portForNextGame) || portForNextGame === null || portForNextGame === undefined) {
        portForNextGame = Number(3010);
      }

      waiting[gameId] = {
        resolve: res,
        reject: rej,
      };

      servers[portForNextGame].send("createGame", {
        gameId: gameId,
        key: process.env.LOAD_BALANCER_KEY,
        hostId: hostId,
        gameType: gameType,
        settings: settings,
      });

      setTimeout(() => {
        if (!waiting[gameId]) return;

        rej(new Error("Timeout creating game on game server"));
        delete waiting[gameId];
      }, Number(process.env.GAME_CREATION_TIMEOUT));
    } catch (e) {
      logger.error(e);
      rej(e);
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
