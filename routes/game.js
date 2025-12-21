const express = require("express");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const utils = require("../lib/Utils");
const redis = require("../modules/redis");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const logger = require("../modules/logging")(".");
const router = express.Router();
const axios = require("axios");

router.post("/leave", async function (req, res) {
  try {
    var userId;

    if (req.body.key == process.env.BOT_KEY) userId = req.body.userId;
    else userId = await routeUtils.verifyLoggedIn(req);

    try {
      await gameLoadBalancer.leaveGame(userId);
    } catch (e) {
      await redis.leaveGame(userId);
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error leaving game");
  }
});

router.get("/mostPlayedRecently", async (req, res) => {
  try {
    const maxSetups = 5;
    const daysInterval = 7;

    const { lobby = "All" } = req.query;

    const matchfilter = {
      broken: { $exists: false },
      endTime: {
        $gt:
          new Date(new Date().setHours(0, 0, 0, 0)).getTime() -
          daysInterval * 24 * 60 * 60 * 1000,
      },
    };

    if (lobby && lobby !== "All") {
      matchfilter["lobby"] = lobby;
    }

    const games = await models.Game.aggregate([
      { $match: matchfilter },
      { $group: { _id: "$setup", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "setups",
          localField: "_id",
          foreignField: "_id",
          as: "setupDetails",
        },
      },
      { $unwind: "$setupDetails" },
      { $sort: { count: -1, _id: 1 } },
      { $limit: maxSetups },
      {
        $lookup: {
          from: "games",
          pipeline: [
            {
              $match: {
                broken: { $exists: false },
                endTime: {
                  $gt:
                    new Date(new Date().setHours(0, 0, 0, 0)).getTime() -
                    daysInterval * 24 * 60 * 60 * 1000,
                },
              },
            },
            { $count: "totalCount" },
          ],
          as: "total",
        },
      },
      { $unwind: "$total" },
      {
        $addFields: {
          percentage: { $divide: ["$count", "$total.totalCount"] },
        },
      },
      { $project: { _id: 1, count: 1, percentage: 1, setupDetails: 1 } },
    ]);
    res.json(games);
  } catch (err) {
    logger.error(err);
    res.status(500).end();
  }
});

router.get("/list", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var start = ((Number(req.query.page) || 1) - 1) * constants.lobbyPageSize;
    var listName = String(req.query.list).toLowerCase();
    var lobby = String(req.query.lobby || "All");
    var last = Number(req.query.last);
    var first = Number(req.query.first);
    var games = [];

    if (
      !routeUtils.validProp(lobby) ||
      (constants.lobbies.indexOf(lobby) == -1 && lobby != "All")
    ) {
      logger.error("Invalid lobby.");
      res.send([]);
      return;
    }

    var end = start + constants.lobbyPageSize;

    if (listName == "all" || listName == "open") {
      var openGames = await redis.getOpenPublicGames();
      openGames.sort((a, b) => {
        return routeUtils.scoreGame(b) - routeUtils.scoreGame(a);
      });
      games = games.concat(openGames);
    }

    if (listName == "all" || listName == "in progress") {
      var inProgressGames = await redis.getInProgressPublicGames();
      inProgressGames.sort((a, b) => b.startTime - a.startTime);
      games = games.concat(inProgressGames);
    }

    if (lobby != "All") games = games.filter((game) => game.lobby == lobby);

    games = games.slice(start, end);

    for (let i in games) {
      let game = games[i];
      let newGame = {};

      newGame.id = game.id;
      newGame.type = game.type;
      newGame.setup = await models.Setup.findOne({
        id: game.settings.setup,
      }).select(
        "id gameType name roles closed gameSettings useRoleGroups roleGroupSizes count total -_id"
      );
      newGame.setup = newGame.setup.toJSON();
      newGame.hostId = game.hostId;
      newGame.players = game.players.length;
      newGame.spectatorCount = game.spectatorCount;
      newGame.gameState = game.gameState;
      newGame.winnersInfo = game.winnersInfo;
      newGame.spectatorCount = game.spectatorCount;
      newGame.lobbyName = game.settings.lobbyName;
      newGame.ranked = game.settings.ranked;
      newGame.competitive = game.settings.competitive;
      newGame.spectating = game.settings.spectating;
      newGame.scheduled = game.settings.scheduled;
      newGame.readyCheck = game.settings.readyCheck;
      newGame.noVeg = game.settings.noVeg;
      newGame.anonymousGame = game.settings.anonymousGame;
      newGame.anonymousDeck = game.settings.anonymousDeck;
      newGame.status = game.status;
      newGame.lobby = game.lobby;
      newGame.endTime = 0;

      if (userId) {
        var reservations = await redis.getGameReservations(game.id);
        newGame.reserved = reservations.indexOf(userId) != -1;
      }

      games[i] = newGame;
    }

    if (
      (listName == "all" || listName == "finished") &&
      games.length < constants.lobbyPageSize
    ) {
      var gameFilter = lobby != "All" ? { lobby } : {};
      var finishedGames = await routeUtils.modelPageQuery(
        models.Game,
        gameFilter,
        "endTime",
        last,
        first,
        "id type setup lobby lobbyName anonymousGame anonymousDeck ranked competitive private spectating guests readyCheck noVeg stateLengths gameTypeOptions broken winnersInfo playerIdMap playerAlignmentMap endTime -_id",
        constants.lobbyPageSize - games.length,
        [
          "setup",
          "id gameType name roles closed useRoleGroups roleGroupSizes count total -_id",
        ]
      );
      finishedGames = finishedGames.map((game) => ({
        ...game.toJSON(),
        status: "Finished",
      }));
      games = games.concat(finishedGames);
    }

    res.send(games);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/:id/connect", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var gameId = String(req.params.id);
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var game = await redis.getGameInfo(gameId, true);

    const now = Date.now();
    const isSpectating = req.query.spectate === "true";

    if (!game) {
      res.status(500);
      res.send("Game not found.");
      return;
    }

    if (!userId && !game.settings.guests) {
      res.status(500);
      res.send("You must be logged in to join or spectate games.");
      return;
    }

    // If the user is in this game, then ignore all checks so that they can finish out the game
    const userInThisGame = userId && (await redis.inGame(userId)) === gameId;

    if (!userInThisGame) {
      if (userId && game.settings.ranked && !isSpectating) {
        const user = await redis.getUserInfo(userId);

        if (!user || user.gamesPlayed < constants.minimumGamesForRanked) {
          res.status(400);
          res.send(
            `You cannot play ranked games until you've played ${constants.minimumGamesForRanked} games.`
          );
          return;
        }

        if (!user || user.redHearts <= 0) {
          res.status(400);
          res.send(
            "You cannot play ranked games because your Red Hearts are depleted."
          );
          return;
        }
      }

      if (userId && !isSpectating) {
        const leavePentalty = await models.LeavePenalty.findOne({
          userId: userId,
        }).select("canPlayAfter");

        if (leavePentalty && now < leavePentalty.canPlayAfter) {
          const minutesUntilCanPlayAgain = Math.trunc(
            (leavePentalty.canPlayAfter - now) / 60000
          );
          res.status(400);
          res.send(
            `You are unable to play games for another ${minutesUntilCanPlayAgain} minutes due to leaving game(s).`
          );
          return;
        }
      }

      if (userId && !(await routeUtils.verifyPermission(userId, "playGame"))) {
        res.status(500);
        res.send("You are unable to play games.");
        return;
      }

      if (
        userId &&
        game.settings.ranked &&
        !(await routeUtils.verifyPermission(userId, "playRanked"))
      ) {
        res.status(500);
        res.send(
          "You are unable to play ranked games. Please contact an admin if this is in error."
        );
        return;
      }

      if (
        userId &&
        game.settings.competitive &&
        !(await routeUtils.verifyPermission(userId, "playCompetitive"))
      ) {
        res.status(500);
        res.send(
          "You have not been approved for competitive games. Please message an admin for assistance."
        );
        return;
      }
    }

    var type = game.type;
    var port = game.port;
    var token = userId && (await redis.createAuthToken(userId));

    if (type && !isNaN(port))
      res.send({ port, type, token, hostId: game.hostId });
    else {
      res.status(500);
      res.send("Error loading game.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading game.");
  }
});

router.get("/:id/review/data", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var gameId = String(req.params.id);
    var perm = "reviewPrivate";

    let game = await models.Game.findOne({ id: gameId })
      .select("-_id")
      .populate("setup", "-_id")
      .populate({
        path: "users",
        select: "id avatar tag settings customEmotes -_id",
        populate: [
          {
            path: "customEmotes",
            model: "CustomEmote",
            select: "id extension name -_id",
          },
        ],
      });

    if (!game || !userId) {
      res.status(500);
      res.send("Game not found");
      return;
    }

    if (game !== null) {
      game = game.toJSON();
      game.users = await Promise.all(
        game.users.map(async (user) => {
          // Get vanity URL for each user
          const vanityUrl = await models.VanityUrl.findOne({
            userId: user.id,
          }).select("url -_id");

          return {
            ...user,
            settings: {
              textColor: user.settings.textColor,
              nameColor: user.settings.textColor,
            },
            vanityUrl: vanityUrl?.url,
          };
        })
      );

      for (let user of game.users) {
        utils.remapCustomEmotes(user, user.id);
      }

      function userIsInGame() {
        for (let user of game.users) {
          if (user.id == userId) {
            return true;
          }
        }
        return false;
      }
      if (
        !game.private ||
        (await routeUtils.verifyPermission(userId, perm)) ||
        userIsInGame()
      ) {
        res.send(game);
        return;
      } else {
        res.status(500);
        res.send("Game not found");
        return;
      }
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading game info");
  }
});

router.get("/:id/info", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var gameId = String(req.params.id);
    var game = await redis.getGameInfo(gameId);

    if (!game) {
      game = await models.Game.findOne({ id: gameId })
        .select(
          "type users players left stateLengths lobbyName ranked competitive anonymousGame anonymousDeck spectating guests readyCheck noVeg startTime endTime gameTypeOptions winners winnersInfo kudosReceiver playerIdMap playerAlignmentMap -_id"
        )
        .populate("users", "id name avatar -_id");

      if (!game) {
        res.status(500);
        res.send("Game not found");
        return;
      }

      game = game.toJSON();
      game.totalPlayers = game.players.length - game.left.length;
      game.players = game.users.slice(
        0,
        game.players.length - game.left.length
      );
      game.settings = {
        ranked: game.ranked,
        competitive: game.competitive,
        spectating: game.spectating,
        anonymousGame: game.anonymousGame,
        anonymousDeck: game.anonymousDeck,
        guests: game.guests,
        readyCheck: game.readyCheck,
        noVeg: game.noVeg,
        stateLengths: game.stateLengths,
        gameTypeOptions: JSON.parse(game.gameTypeOptions),
      };

      delete game.users;
      delete game.ranked;
      delete game.competitive;
      delete game.spectating;
      delete game.anonymousGame;
      delete game.anonymousDeck;
      delete game.stateLengths;
      delete game.gameTypeOptions;
    } else {
      delete game.port;
      delete game.status;
    }

    res.send(game);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading game info");
  }
});

router.post("/host", async function (req, res) {
  try {
    var userId;

    if (req.body.key == process.env.BOT_KEY) userId = req.body.userId;
    else userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(userId, "playGame"))) {
      res.status(500);
      res.send("You are unable to play games.");
      return;
    }

    var gameType = String(req.body.gameType);
    var lobby = String(req.body.lobby);
    var lobbyName = req.body.lobbyName ? String(req.body.lobbyName) : null;
    var rehostId = req.body.rehost && String(req.body.rehost);
    var scheduled = Number(req.body.scheduled);

    const now = Date.now();

    if (
      !routeUtils.validProp(gameType) ||
      constants.gameTypes.indexOf(gameType) == -1
    ) {
      res.status(500);
      res.send("Invalid game type.");
      return;
    }

    if (
      !routeUtils.validProp(lobby) ||
      constants.lobbies.indexOf(lobby) == -1
    ) {
      res.status(500);
      res.send("Invalid lobby.");
      return;
    }

    if (rehostId) {
      var openGames = await redis.getOpenGames(gameType);

      for (let game of openGames) {
        if (game.settings.rehostId == rehostId) {
          res.send(game.id);
          return;
        }
      }
    }

    var configuredStateLengths = Object(req.body.stateLengths);
    var stateLengths = {};

    for (let stateName in constants.configurableStates[gameType]) {
      let min = constants.configurableStates[gameType][stateName].min;
      let max = constants.configurableStates[gameType][stateName].max;
      let stateLength = Number(configuredStateLengths[stateName]) * 60 * 1000;

      if (isNaN(stateLength) || stateLength < min || stateLength > max)
        stateLength = constants.configurableStates[gameType][stateName].default;

      stateLengths[stateName] = stateLength;
    }

    if (!req.body.setup) {
      res.status(500);
      res.send("Please select a setup");
      return;
    }

    var setup = await models.Setup.findOne({
      id: String(req.body.setup),
    }).select("-_id -__v -creator -hash");

    if (!setup) {
      res.status(500);
      res.send("Setup not found");
      return;
    }

    if (setup.gameType != gameType) {
      res.status(500);
      res.send("Invalid setup for this game");
      return;
    }

    if (req.body.ranked && !setup.ranked) {
      res.status(500);
      res.send(
        "This setup has not been approved for ranked play. Please contact an admin if this is in error."
      );
      return;
    }

    if (req.body.competitive && !setup.competitive) {
      res.status(500);
      res.send(
        "This setup has not been approved for Competitive play. Please contact an admin if this is in error."
      );
      return;
    }

    if (req.body.ranked && req.body.competitive) {
      res.status(500);
      res.send("You cannot host a game that is both ranked and competitive.");
      return;
    }

    if (req.body.ranked && req.body.private) {
      res.status(500);
      res.send("Ranked games cannot be private.");
      return;
    }

    if (req.body.ranked && req.body.guests) {
      res.status(500);
      res.send("Ranked games cannot contain guests.");
      return;
    }

    if (req.body.competitive && req.body.private) {
      res.status(500);
      res.send("Competitive games cannot be private.");
      return;
    }

    if (req.body.competitive && req.body.guests) {
      res.status(500);
      res.send("Competitive games cannot contain guests.");
      return;
    }

    if (
      req.body.ranked &&
      !(await routeUtils.verifyPermission(userId, "playRanked"))
    ) {
      res.status(500);
      res.send(
        "You are unable to play ranked games. Please contact an admin if this is in error."
      );
      return;
    }

    if (
      req.body.competitive &&
      !(await routeUtils.verifyPermission(userId, "playCompetitive"))
    ) {
      res.status(500);
      res.send(
        "You are unable to play competitive games. Sign up here: https://ultimafia.com/community/forums/thread/ku_mE7QWu"
      );
      return;
    }

    const user = await redis.getUserInfo(userId);
    if (req.body.ranked) {
      if (user && user.gamesPlayed < constants.minimumGamesForRanked) {
        res.status(400);
        res.send(
          `You cannot play ranked games until you've played ${constants.minimumGamesForRanked} games.`
        );
        return;
      }

      if (user && user.redHearts <= 0) {
        res.status(400);
        res.send(
          "You cannot play ranked games because your Red Hearts are depleted."
        );
        return;
      }
    }

    const leavePentalty = await models.LeavePenalty.findOne({
      userId: userId,
    }).select("canPlayAfter");
    if (leavePentalty) {
      if (now < leavePentalty.canPlayAfter) {
        const minutesUntilCanPlayAgain = Math.trunc(
          (leavePentalty.canPlayAfter - now) / 60000
        );
        res.status(400);
        res.send(
          `You are unable to play games for another ${minutesUntilCanPlayAgain} minutes due to leaving game(s).`
        );
        return;
      }
    }

    var settings = settingsChecks[gameType](req.body, setup);
    settings.anonymousGame = Boolean(req.body.anonymousGame);
    settings.anonymousDeckId = String(req.body.anonymousDeckId);

    if (typeof settings == "string") {
      res.status(500);
      res.send(settings);
      return;
    }

    if (settings.anonymousGame) {
      let decks = [];
      for (let item of settings.anonymousDeckId.split(",")) {
        let deck = await models.AnonymousDeck.findOne({
          id: item.trim(),
        }).select("id name disabled profiles");
        if (!deck) {
          res.status(500);
          res.send("Unable to find anonymous deck.");
          return;
        }

        deck = deck.toJSON();

        if (deck.disabled) {
          res.status(500);
          res.send("This deck has been disabled by a moderator.");
          return;
        }
        let deckProfiles = await models.DeckProfile.find({
          _id: { $in: deck.profiles },
        }).select("name avatar id deathMessage color");

        if (!deckProfiles) {
          res.status(500);
          res.send("Unable to find profiles.");
          return;
        }

        if (deckProfiles.length < setup.total) {
          res.status(500);
          res.send("This deck is too small for the chosen setup.");
          return;
        }
        let jsonProfiles = [];
        for (let profile of deckProfiles) {
          profile = profile.toJSON();
          jsonProfiles.push(profile);
        }
        deck.profiles = jsonProfiles;
        decks.push(deck);
      }

      settings.anonymousDeck = decks;
    }

    var lobbyCheck = lobbyChecks[lobby](gameType, req.body, setup);

    if (typeof lobbyCheck == "string") {
      res.status(500);
      res.send(lobbyCheck);
      return;
    }

    setup = setup.toJSON();
    setup.roles = JSON.parse(setup.roles);

    if (await redis.getSetCreatingGame(userId)) {
      res.status(500);
      res.send("Already creating a game.");
      redis.unsetCreatingGame(userId);
      return;
    }

    if (!scheduled && (await redis.inGame(userId))) {
      res.status(500);
      res.send("You must leave your current game before creating a new one.");
      redis.unsetCreatingGame(userId);
      return;
    }

    if (scheduled && (await redis.hostingScheduled(userId))) {
      res.status(500);
      res.send("You already have a game scheduled.");
      redis.unsetCreatingGame(userId);
      return;
    }

    if (scheduled && scheduled < Date.now() + 5 * 60 * 1000) {
      res.status(500);
      res.send("Games must be scheduled at least 5 minutes in advance.");
      redis.unsetCreatingGame(userId);
      return;
    }

    if (scheduled && scheduled > Date.now() + 4 * 7 * 24 * 60 * 60 * 1000) {
      res.status(500);
      res.send("Games must be scheduled to start within 4 weeks.");
      redis.unsetCreatingGame(userId);
      return;
    }

    if (!(await routeUtils.rateLimit(userId, "hostGame", res))) {
      redis.unsetCreatingGame(userId);
      return;
    }

    if (!lobbyName || lobbyName === "" || lobbyName === "undefined") {
      lobbyName = `${user.name}'s lobby`;
    }
    lobbyName = lobbyName.substring(0, 50);

    try {
      var gameId = await gameLoadBalancer.createGame(userId, gameType, {
        setup: setup,
        lobby: lobby,
        lobbyName: lobbyName,
        private: Boolean(req.body.private),
        guests: Boolean(req.body.guests),
        ranked: Boolean(req.body.ranked),
        competitive: Boolean(req.body.competitive),
        spectating: Boolean(req.body.spectating),
        rehostId: rehostId,
        scheduled: scheduled,
        readyCheck: Boolean(req.body.readyCheck),
        noVeg: Boolean(req.body.noVeg),
        stateLengths: stateLengths,
        ...settings,
      });

      res.send(gameId);
      redis.unsetCreatingGame(userId);
      let ping;
      if (gameType !== "Mafia") {
        ping = "<@&1118235252784111666>\n";
      } else if (req.body.competitive) {
        ping = "<@&1180218020069650433>\n";
      } else if (req.body.ranked) {
        ping = "<@&1118005995579379823>\n";
      } else {
        ping = "<@&1118006284462063666>\n";
      }
      if (!req.body.private) {
        if (process.env.DISCORD_GAME_HOOK) {
          try {
            await axios({
              method: "POST",
              url: process.env.DISCORD_GAME_HOOK,
              data: {
                content: `New game! https://ultimafia.com/game/${gameId}\n${ping}${setup.name}`,
                username: "GameBot",
              },
            });
          } catch (e) {
            console.log("error: ", e);
          }
        }
      }
    } catch (e) {
      redis.unsetCreatingGame(userId);
      throw e;
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error hosting game.");
  }
});

router.post("/reserve", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var gameId = String(req.body.gameId);

    if (!(await routeUtils.verifyPermission(userId, "playGame"))) {
      res.status(500);
      res.send("You are unable to play games.");
      return;
    }

    var game = await redis.getGameInfo(gameId);

    if (!game) {
      res.status(500);
      res.send("Game not found.");
      return;
    }

    if (!game.settings.scheduled) {
      res.status(500);
      res.send("Game is not scheduled to start in the future.");
      return;
    }

    if (game.settings.scheduled <= Date.now()) {
      res.status(500);
      res.send(
        "Reservations are closed, try joining if the game has not started yet."
      );
      return;
    }

    var reserved = await redis.reserveGame(userId, gameId);

    if (reserved) res.send("Spot reserved!");
    else
      res.send(
        "Reservations are full. You have been added to the backup queue."
      );
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error reserving seat in game.");
  }
});

router.post("/unreserve", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var gameId = String(req.body.gameId);

    var game = await redis.getGameInfo(gameId);

    if (!game) {
      res.status(500);
      res.send("Game not found.");
      return;
    }

    if (!game.settings.scheduled) {
      res.status(500);
      res.send("Game is not scheduled to start in the future.");
      return;
    }

    await redis.unreserveGame(userId, gameId);
    res.send("Game reservation cancelled.");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error unreserving seat in game.");
  }
});

router.post("/:id/archive", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var gameId = String(req.params.id);

    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "itemsOwned _id"
    );
    user = user.toJSON();

    var itemsOwned = await redis.getUserItemsOwned(userId);

    if (!itemsOwned.archivedGames) {
      res.status(500);
      res.send("You must purchase archived games from the Shop.");
      return;
    }

    var archivedGames = await models.ArchivedGame.find({
      user: user._id,
    }).select("user game");
    if (archivedGames.length >= itemsOwned.archivedGamesMax) {
      res.status(500);
      res.send("You must purchase additional archived games from the Shop.");
      return;
    }

    var game = await models.Game.findOne({ id: gameId })
      .select("type setup startTime _id")
      .populate("setup", "name -_id");

    if (!game) {
      res.status(500);
      res.send("Game not found");
      return;
    }

    if (
      archivedGames
        .map((item) => item.game.toString())
        .includes(game._id.toString())
    ) {
      res.status(500);
      res.send("You've already archived this game.");
      return;
    }

    var descriptionDate = new Date(game.startTime).toDateString();

    var archivedGame = new models.ArchivedGame({
      user: user._id,
      game: game._id,
      description: `${game.type} ${game.setup.name} ${descriptionDate}`,
    });
    await archivedGame.save();

    res.send("Successfully archived game.");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error archiving game.");
  }
});

router.delete("/:id/archive", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var gameId = String(req.params.id);

    var user = await models.User.findOne({ id: userId }).select("_id");
    var game = await models.Game.findOne({ id: gameId }).select("_id");

    var status = await models.ArchivedGame.deleteOne({
      user: user._id,
      game: game._id,
    });

    if (status.deletedCount > 0) {
      res.send("Successfully unarchived game.");
      return;
    } else {
      return;
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting archived game.");
  }
});

router.post("/cancel", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var gameId = String(req.body.gameId);

    var game = await redis.getGameInfo(gameId);

    if (!game) {
      res.status(500);
      res.send("Game not found.");
      return;
    }

    if (userId != game.hostId) {
      res.status(500);
      res.send("You are not the host of this game.");
      return;
    }

    if (!game.settings.scheduled) {
      res.status(500);
      res.send("Game is not scheduled to start in the future.");
      return;
    }

    await gameLoadBalancer.cancelGame(userId, gameId);
    res.send("Scheduled game cancelled.");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error cancelling scheduled game.");
  }
});

const lobbyChecks = {
  Main: (gameType, setup, settings) => {
    if (gameType != "Mafia") return "Only Mafia is allowed in the Main lobby.";

    if (setup.competitive)
      return "Competitive games are not allowed in the Main lobby.";
  },
  Sandbox: (gameType, setup, settings) => {
    if (setup.ranked) return "Ranked games are not allowed in Sandbox lobby.";

    if (setup.competitive)
      return "Competitive games are not allowed in Sandbox lobby.";
  },
  Competitive: (gameType, setup, settings) => {
    if (gameType != "Mafia")
      return "Only Mafia is allowed in Competitive lobby.";

    if (setup.ranked)
      return "Ranked games are not allowed in Competitive lobby.";

    if (!setup.competitive)
      return "Only competitive games are allowed in Competitive lobby";
  },
  Games: (gameType, setup, settings) => {
    if (gameType == "Mafia")
      return "Only games other than Mafia are allowed in Games lobby.";
  },
  Survivor: (gameType, setup, settings) => {
    if (setup.ranked) return "Ranked games are not allowed in Survivor lobby.";

    if (setup.competitive)
      return "Competitive games are not allowed in Survivor lobby.";
  },
  Roleplay: (gameType, setup, settings) => {
    if (!setup.anonymousGame)
      return "Only Anonymous games are allowed in Roleplay lobby.";
  },
};

const settingsChecks = {
  Mafia: (settings, setup) => {
    var extendLength = Number(settings.extendLength);
    if (extendLength < 0 || extendLength > 5)
      return "Extension length must be between 1 and 5 minutes.";

    var pregameWaitLength = Number(settings.pregameWaitLength);
    if (pregameWaitLength < 1 || pregameWaitLength > 6) {
      return "Pregame wait length must be between 1 and 6 hours.";
    }

    var advancedHosting = Boolean(settings.advancedHosting);

    return { extendLength, pregameWaitLength, advancedHosting };
  },
  Resistance: (settings, setup) => {
    return {};
  },
  Jotto: (settings, setup) => {
    let wordLength = Number(settings.wordLength);
    if (wordLength < 4 || wordLength > 5) {
      return "We only support Jotto for 4 or 5 letters.";
    }

    let duplicateLetters = Boolean(settings.duplicateLetters);
    let competitiveMode = Boolean(settings.competitiveMode);
    let forbiddenMode = Boolean(settings.forbiddenMode);
    let winOnAnagrams = Boolean(settings.winOnAnagrams);
    let numAnagramsRequired = Number(settings.numAnagramsRequired);

    if (numAnagramsRequired < 1) {
      return "Number of required anagrams must be at least 1";
    }

    return {
      wordLength,
      duplicateLetters,
      competitiveMode,
      forbiddenMode,
      winOnAnagrams,
      numAnagramsRequired,
    };
  },
  Acrotopia: (settings, setup) => {
    let roundAmt = settings.roundAmt;
    let acronymSize = settings.acronymSize;
    let enablePunctuation = settings.enablePunctuation;
    let standardiseCapitalisation = settings.standardiseCapitalisation;
    let turnOnCaps = settings.turnOnCaps;

    return {
      roundAmt,
      acronymSize,
      enablePunctuation,
      standardiseCapitalisation,
      turnOnCaps,
    };
  },
  "Secret Dictator": (settings, setup) => {
    return {};
    // return "Secret Dictator is currently not available.";
  },
  "Wacky Words": (settings, setup) => {
    let roundAmt = settings.roundAmt;
    let acronymSize = settings.acronymSize;
    let enablePunctuation = settings.enablePunctuation;
    let standardiseCapitalisation = settings.standardiseCapitalisation;
    let turnOnCaps = settings.turnOnCaps;
    let isRankedChoice = settings.isRankedChoice;
    let votesToPoints = settings.votesToPoints;

    return {
      roundAmt,
      acronymSize,
      enablePunctuation,
      standardiseCapitalisation,
      turnOnCaps,
      isRankedChoice,
      votesToPoints,
    };
  },
  "Liars Dice": (settings, setup) => {
    let wildOnes = settings.wildOnes;
    let spotOn = settings.spotOn;
    let startingDice = settings.startingDice;

    return {
      wildOnes,
      spotOn,
      startingDice,
    };
  },
  "Texas Hold Em": (settings, setup) => {
    let minimumBet = settings.minimumBet;
    let startingChips = settings.startingChips;
    let MaxRounds = settings.MaxRounds;

    return {
      minimumBet,
      startingChips,
      MaxRounds,
    };
  },
  Cheat: (settings, setup) => {
    let MaxRounds = settings.MaxRounds;

    return {
      MaxRounds,
    };
  },
  Ratscrew: (settings, setup) => {
    let MaxRounds = settings.MaxRounds;

    return {
      MaxRounds,
    };
  },
  Battlesnakes: (settings, setup) => {
    const boardSize = settings.boardSize;

    return {
      boardSize,
    };
  },
  "Dice Wars": (settings, setup) => {
    const mapSize = settings.mapSize;
    const maxDice = settings.maxDice;

    return {
      mapSize,
      maxDice,
    };
  },
  "Connect Four": (settings, setup) => {
    const boardX = settings.boardX;
    const boardY = settings.boardY;

    return {
      boardX,
      boardY,
    };
    // return "Connect Four is currently not available.";
  },
};

module.exports = router;
