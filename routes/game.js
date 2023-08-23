const express = require("express");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const logger = require("../modules/logging")(".");
const router = express.Router();

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

router.get("/list", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var start = ((Number(req.query.page) || 1) - 1) * constants.lobbyPageSize;
    var listName = String(req.query.list).toLowerCase();
    var lobby = String(req.query.lobby || "All");
    var last = Number(req.query.last) || Infinity;
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

    if (lobby == "Main") {
      lobby = "Mafia";
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
      }).select("id gameType name roles closed useRoleGroups count total -_id");
      newGame.setup = newGame.setup.toJSON();
      newGame.hostId = game.hostId;
      newGame.players = game.players.length;
      newGame.ranked = game.settings.ranked;
      newGame.spectating = game.settings.spectating;
      newGame.voiceChat = game.settings.voiceChat;
      newGame.scheduled = game.settings.scheduled;
      newGame.readyCheck = game.settings.readyCheck;
      newGame.status = game.status;
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
        "id type setup ranked private spectating guests voiceChat readyCheck stateLengths gameTypeOptions broken endTime -_id",
        constants.lobbyPageSize - games.length,
        [
          "setup",
          "id gameType name roles closed useRoleGroups count total -_id",
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
        "You are unable to play ranked games. Please check the pinned threads in Community > Discussion."
      );
      return;
    }

    var type = game.type;
    var port = game.port;
    var token = userId && (await redis.createAuthToken(userId));

    if (type && !isNaN(port)) res.send({ port, type, token });
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
      .populate("users", "id avatar tag settings emojis -_id");

    if (
      game &&
      (!game.private ||
        (userId && (await routeUtils.verifyPermission(userId, perm))))
    ) {
      game = game.toJSON();
      game.users = game.users.map((user) => ({
        ...user,
        settings: {
          textColor: user.settings.textColor,
          nameColor: user.settings.textColor,
        },
      }));
      res.send(game);
    } else {
      res.status(500);
      res.send("Game not found");
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
          "type users players left stateLengths ranked spectating guests voiceChat readyCheck startTime endTime gameTypeOptions -_id"
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
        spectating: game.spectating,
        guests: game.guests,
        voiceChat: game.voiceChat,
        readyCheck: game.readyCheck,
        stateLengths: game.stateLengths,
        gameTypeOptions: JSON.parse(game.gameTypeOptions),
      };

      delete game.users;
      delete game.ranked;
      delete game.spectating;
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
    var rehostId = req.body.rehost && String(req.body.rehost);
    var scheduled = Number(req.body.scheduled);

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
        "This setup has not been approved by mods for ranked play. Please check the pinned threads in Community > Discussion."
      );
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

    if (req.body.ranked && req.body.spectating) {
      res.status(500);
      res.send("Ranked games cannot be spectated.");
      return;
    }

    if (req.body.ranked && req.body.voiceChat) {
      res.status(500);
      res.send("Ranked games cannot use voice chat.");
      return;
    }

    if (req.body.voiceChat && req.body.spectating) {
      res.status(500);
      res.send("Voice chat games cannot be spectated.");
      return;
    }

    if (
      req.body.ranked &&
      !(await routeUtils.verifyPermission(userId, "playRanked"))
    ) {
      res.status(500);
      res.send(
        "You are unable to play ranked games. Please check the pinned threads in Community > Discussion."
      );
      return;
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
      let deck = await models.AnonymousDeck.findOne({
        id: settings.anonymousDeckId,
      }).select("name disabled profiles");
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
      let deckProfiles = await models.DeckProfile.find({_id: {$in: deck.profiles}},function(err, profiles) {
        if (err) {
          res.status(500);
          res.send("Unable to find profiles.");
          return;
        }

        if (deck.profiles.length < setup.total) {
          res.status(500);
          res.send("This deck is too small for the chosen setup.");
          return;
        }
      }).select("name avatar id deathMessage color");

      let jsonProfiles = [];
      for (let profile of deckProfiles) {
        profile = profile.toJSON();
        jsonProfiles.push(profile);
      }

      settings.anonymousDeck = deck;
      settings.anonymousDeck.profiles = jsonProfiles;
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

    try {
      var gameId = await gameLoadBalancer.createGame(userId, gameType, {
        setup: setup,
        lobby: lobby,
        private: Boolean(req.body.private),
        guests: Boolean(req.body.guests),
        ranked: Boolean(req.body.ranked),
        spectating: Boolean(req.body.spectating),
        // voiceChat: Boolean(req.body.voiceChat),
        voiceChat: false,
        rehostId: rehostId,
        scheduled: scheduled,
        readyCheck: Boolean(req.body.readyCheck),
        stateLengths: stateLengths,
        ...settings,
      });

      res.send(gameId);
      redis.unsetCreatingGame(userId);
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
  Mafia: (gameType, setup, settings) => {
    if (gameType != "Mafia") return "Only Mafia is allowed in the Mafia lobby.";

    if (setup.comp)
      return "Competitive games are not allowed in the Mafia lobby.";
  },
  //Sandbox: (gameType, setup, settings) => {
  //  if (setup.ranked) return "Ranked games are not allowed in Sandbox lobby.";

  //  if (setup.comp)
  //    return "Competitive games are not allowed in Sandbox lobby.";
  //},
  Competitive: (gameType, setup, settings) => {
    if (gameType != "Mafia")
      return "Only Mafia is allowed in Competitive lobby.";

    if (setup.ranked)
      return "Ranked games are not allowed in Competitive lobby.";

    if (!setup.comp)
      return "Only competitive games are allowed in Competitive lobby";
  },
  Games: (gameType, setup, settings) => {
    if (gameType == "Mafia")
      return "Only games other than Mafia are allowed in Games lobby.";
  },
  Roleplay: (gameType, setup, settings) => {
    if (!setup.anonymousGame)
      return "Only Anonymous games are allowed in Roleplay lobby.";
  },
};

const settingsChecks = {
  Mafia: (settings, setup) => {
    var extendLength = Number(settings.extendLength);

    if (extendLength < 1 || extendLength > 5)
      return "Extension length must be between 1 and 5 minutes.";

    return { extendLength };
  },
  "Split Decision": (settings, setup) => {
    return {};
  },
  Resistance: (settings, setup) => {
    return {};
  },
  "One Night": (settings, setup) => {
    return {};
  },
  Ghost: (settings, setup) => {
    // default: configureWords is false
    let wordOptions = settings.wordOptions;
    let configureWords = wordOptions?.configureWords;

    if (!configureWords) {
      return { configureWords };
    }

    // configure custom words
    let wordLength = Number(wordOptions.wordLength);
    if (wordLength < 3 || wordLength > 10) {
      return "Please choose a word from 3 to 10 letters long.";
    }

    let roles = JSON.parse(setup.roles)[0];
    let hasHostInGame = roles["Host:"];
    if (!hasHostInGame)
      return "You can only configure words when the setup has the Host role added";

    let townWord = wordOptions.townWord?.toLowerCase();
    if (!townWord) return "Town word is not specified";
    if (townWord.length !== wordLength)
      return "Town word length must be equal to the word size specified";
    if (!/^[a-zA-Z]+$/.test(townWord)) return "Town word must be alphabetic";

    let hasFoolInGame = roles["Fool:"];
    if (!hasFoolInGame) return { configureWords, wordLength, townWord };

    let foolWord = wordOptions.foolWord?.toLowerCase();
    if (!foolWord) return "Fool word is not specified";
    if (foolWord.length !== wordLength)
      return "Fool word length must be equal to the word size specified";
    if (!/^[a-zA-Z]+$/.test(foolWord)) return "Fool word must be alphabetic";
    if (townWord == foolWord)
      return "Fool word cannot be the same as the town word";

    return { configureWords, wordLength, townWord, foolWord };
  },
  Jotto: (settings, setup) => {
    let wordLength = Number(settings.wordLength);
    if (wordLength < 4 || wordLength > 5) {
      return "We only support Jotto for 4 or 5 letters.";
    }

    let duplicateLetters = Boolean(settings.duplicateLetters);
    let competitiveMode = Boolean(settings.competitiveMode);
    let winOnAnagrams = Boolean(settings.winOnAnagrams);
    let numAnagramsRequired = Number(settings.numAnagramsRequired);

    if (numAnagramsRequired < 1) {
      return "Number of required anagrams must be at least 1";
    }

    return {
      wordLength,
      duplicateLetters,
      competitiveMode,
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
  "Secret Hitler": (settings, setup) => {
    return {};
    // return "Secret Hitler is currently not available.";
  },
};

module.exports = router;
