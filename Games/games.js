const dotenv = require("dotenv").config();
const shortid = require("shortid");
const models = require("../db/models");
const sockets = require("../lib/sockets");
const utils = require("../lib/Utils");
const db = require("../db/db");
const redis = require("../modules/redis");
const routeUtils = require("../routes/utils");
const constants = require("../data/constants");
const logger = require("../modules/logging")("games");
const User = require("./core/User");
const { removeSpaces } = require("./core/Utils");
const publisher = redis.client.duplicate();
const axios = require("axios");

const serverId = Number(process.env.NODE_APP_INSTANCE) || 0;
const port = Number(process.env.GAME_PORT || "3010") + serverId;
const server = new sockets.SocketServer(port);

var games = {};
var deprecated = false;

(async function () {
  try {
    await redis.registerGameServer(port);
    await publisher.publish("gamePorts", port);
    await db.promise;

    const wrapOnClose = (msg) => {
      console.log(`Calling *onClose* with msg: ${msg}`);
      onClose();
    };

    const handleError = async (e) => {
      var stack = e.stack.split("\n").slice(0, 6).join("\n");

      if (process.env.DISCORD_ERROR_HOOK === undefined) {
        console.log("Error: " + e);
        return;
      }

      const discordAlert = JSON.parse(process.env.DISCORD_ERROR_HOOK);
      try {
        await axios({
          method: "post",
          url: discordAlert.hook,
          data: {
            content: `Error stack: \`\`\` ${stack}\`\`\``,
            username: "Errorbot",
            thread_name: `Game Error! ${e.message.split("'", "\n")[0]}`,
          },
        });
      } catch (e) {
        console.log("Error throwing error! " + e);
      }
    };

    const errorHandle = (e) => {
      logger.error(e);
      handleError(e);
    };

    process
      .on("unhandledRejection", (err) => errorHandle(err))
      .on("uncaughtException", (err) => errorHandle(err))
      .on("exit", () => wrapOnClose("exit"))
      .on("SIGINT", () => wrapOnClose("SIGINT"))
      .on("SIGUSR1", () => wrapOnClose("SIGUSR1"))
      .on("SIGUSR2", () => wrapOnClose("SIGUSR2"));

    clearBrokenGames();

    server.on("connection", (socket) => {
      try {
        var user;

        socket.send("connected");

        socket.on("auth", async (token) => {
          try {
            if (user) return;

            const userId = await redis.authenticateToken(String(token));
            if (!userId) return;

            const maxOwnedCustomEmotes =
              constants.maxOwnedCustomEmotes +
              constants.maxOwnedCustomEmotesExtra;

            user = await models.User.findOne({
              id: userId,
              deleted: false,
            })
              .select(
                "id name avatar settings customEmotes dev itemsOwned rankedCount competitiveCount stats achievements playedGame birthday referrer"
              )
              .populate([
                {
                  path: "customEmotes",
                  select: "id extension name -_id",
                  options: { limit: maxOwnedCustomEmotes },
                },
              ]);

            if (!user) {
              user = null;
              return;
            }

            if (!(await routeUtils.verifyPermission(userId, "playGame"))) {
              socket.send("banned");
              socket.terminate();
              return;
            }

            user = user.toObject();
            user.socket = socket;
            user.settings = user.settings || {};
            utils.remapCustomEmotes(user, userId);
            user = new User(user);

            socket.send("authSuccess");
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("join", async (info) => {
          try {
            const gameId = String(info.gameId);
            const game = games[gameId];
            var isBot = false;

            if (!user && !game.guests) return;
            else if (!user) {
              var guestId = String(info.guestId).slice(0, 20);
              user = new User({ socket, guestId });
              isBot = true;
            }

            isBot = isBot || (user.dev && info.isBot);

            if (isBot) {
              user.id = shortid.generate();
              user.name = null;
              user.avatar = false;
            }

            if (!game || !(await redis.gameExists(gameId))) {
              socket.send("error", "Unable to join game.");
              return;
            }

            if (game.scheduled) {
              if (Date.now() < game.scheduled) {
                socket.send("error", "Scheduled game has not started yet.");
                return;
              } else if (
                Date.now() <
                game.scheduled + constants.gameReserveTime
              ) {
                var reservations = await redis.getGameReservations(
                  gameId,
                  0,
                  game.setup.total - game.players.length
                );

                if (reservations.indexOf(user.id) == -1) {
                  socket.send(
                    "error",
                    `All spots are currently filled or reserved. If the game does not fill soon then reservations will be released.`
                  );
                  return;
                } else await redis.unreserveGame(user.id, gameId);
              }
            }

            game.userJoin(user, isBot);
          } catch (e) {
            logger.error(e);
          }
        });

        // The main server authenticating as a server
        socket.on("authAsServer", async (token) => {
          try {
            if (token == process.env.LOAD_BALANCER_KEY) socket.isServer = true;
          } catch (e) {
            logger.error(e);
          }
        });

        // The main server attempting to create a game
        socket.on("createGame", async (data) => {
          try {
            if (!socket.isServer)
              throw new Error("Not authenticated as server");

            const Game = require(`./types/${removeSpaces(data.gameType)}/Game`);

            games[data.gameId] = new Game({
              id: data.gameId,
              hostId: data.hostId,
              port: port,
              settings: data.settings,
            });
            await games[data.gameId].init();

            socket.send("gameCreated", data.gameId);
          } catch (e) {
            logger.error(e);
            socket.send("gameCreateError", {
              gameId: data.gameId,
              error: e.message,
            });
          }
        });

        // The main server making a player leave a game
        socket.on("leaveGame", async (data) => {
          try {
            if (!socket.isServer)
              throw new Error("Not authenticated as server.");

            const gameId = await redis.inGame(data.userId);
            const game = games[gameId];

            if (!game)
              throw new Error(
                `User ${data.userId} unable to leave game ${gameId}.`
              );

            game.userLeave(data.userId);
            socket.send("gameLeft", data.userId);
          } catch (e) {
            logger.error(e);
            socket.send("gameLeaveError", {
              userId: data.userId,
              error: e.message,
            });
          }
        });

        // The main server canceling a game
        socket.on("cancelGame", async (data) => {
          try {
            if (!socket.isServer)
              throw new Error("Not authenticated as server.");

            const game = games[data.gameId];

            if (!game) throw new Error(`Unable to cancel game ${gameId}.`);

            game.cancel();
            socket.send("gameLeft", data.userId);
          } catch (e) {
            logger.error(e);
            socket.send("gameLeaveError", {
              userId: data.userId,
              error: e.message,
            });
          }
        });

        // The main server marking deprecating this process
        socket.on("deprecated", async (data) => {
          try {
            if (!socket.isServer)
              throw new Error("Not authenticated as server.");

            deprecated = true;
            await deprecationCheck();
          } catch (e) {
            logger.error(e);
          }
        });
      } catch (e) {
        logger.error(e);
      }
    });
  } catch (e) {
    logger.error(e);
  }
})();

async function onClose() {
  try {
    await redis.removeGameServer(port);
    await clearBrokenGames();
    await redis.client.quitAsync();
    process.exit();
  } catch (e) {
    logger.error(e);
  }
}

async function clearBrokenGames() {
  try {
    var existingGames = await redis.getAllGames();

    for (let game of existingGames) {
      if (game.port != port) continue;
      if (game.settings.scheduled > Date.now()) continue;

      if (game.status == "Open") await redis.deleteGame(game.id);
      else await redis.breakGame(game.id);
    }
  } catch (e) {
    logger.error(e);
  }
}

async function deprecationCheck() {
  if (deprecated && Object.keys(games).length == 0) {
    console.log("The Game Service is deprecated… Closing it!");
    await onClose();
  }
}

module.exports = { games, deprecationCheck };
