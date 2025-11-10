const Player = require("./Player");
const Event = require("./Event");
const Spectator = require("./Spectator");
const Message = require("./Message");
const History = require("./History");
const Queue = require("./Queue");
const PregameMeeting = require("./PregameMeeting");
const PregameReadyMeeting = require("./PregameReadyMeeting");
const Timer = require("./Timer");
const Random = require("../../lib/Random");
const Utils = require("./Utils");
const ArrayHash = require("./ArrayHash");
const Action = require("./Action");
const Winners = require("./Winners");
const { games, deprecationCheck } = require("../games");
const events = require("events");
const models = require("../../db/models");
const redis = require("../../modules/redis");
const roleData = require("../../data/roles");
const gameAchievements = require("../../data/Achievements");
const dailyChallengesData = require("../../data/DailyChallenge");
const modifierData = require("../../data/modifiers");
const gameSettingData = require("../../data/gamesettings");
const protips = require("../../data/protips");
const logger = require("../../modules/logging")("games");
const constants = require("../../data/constants");
const renamedRoleMapping = require("../../data/renamedRoles");
const renamedModifierMapping = require("../../data/renamedModifiers");
const routeUtils = require("../../routes/utils");
const PostgameMeeting = require("./PostgameMeeting");
const VegKickMeeting = require("./VegKickMeeting");
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;
const axios = require("axios");
const { ordinal, rating, rate, predictWin } = require("openskill");

module.exports = class Game {
  constructor(options) {
    this.id = options.id;
    this.hostId = options.hostId;
    this.port = options.port;
    this.Player = Player;
    this.events = new events();
    this.events.setMaxListeners(Infinity);
    this.stateLengths = options.settings.stateLengths;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
    ];
    this.currentState = -1;
    this.stateOffset = 0;
    this.stateIndexRecord = [];
    this.stateEvents = {};
    this.stateEventMessages = {};
    this.setup = options.settings.setup;
    this.lobby = options.settings.lobby;
    this.lobbyName = options.settings.lobbyName;
    this.private = options.settings.private;
    this.guests = options.settings.guests;
    this.hasIntegrity = true;
    this.ranked = options.settings.ranked;
    this.competitive = options.settings.competitive;
    this.spectating = options.settings.spectating;
    this.readyCheck = options.settings.readyCheck;
    this.noVeg = options.settings.noVeg;
    this.anonymousGame = options.settings.anonymousGame;
    this.anonymousDeck = options.settings.anonymousDeck;
    this.readyCountdownLength =
      options.settings.readyCountdownLength != null
        ? options.settings.readyCountdownLength
        : 30000;
    // if game does not start after 1 hour, end it
    this.pregameWaitLength =
      options.settings.pregameWaitLength != null
        ? options.settings.pregameWaitLength
        : 1;
    this.pregameCountdownLength =
      options.settings.pregameCountdownLength != null
        ? options.settings.pregameCountdownLength
        : 10000;
    // 5 minutes, if no one kicks the time is up
    this.vegKickCountdownLength =
      options.settings.vegKickCountdownLength != null
        ? options.settings.vegKickCountdownLength
        : 300000;
    this.postgameLength = 1000 * 60 * 2;
    this.players = new ArrayHash();
    this.playersGone = {};
    this.spectators = [];
    this.spectatorLimit = constants.maxSpectators;
    this.history = new History(this);
    this.spectatorHistory = new History(this, "spectator");
    this.spectatorMeetFilter = { "*": true };
    this.timers = {};
    this.actions = [new Queue()];
    this.useObituaries = false;
    this.obituaryQueue = {};
    this.alertQueue = new Queue();
    this.deathQueue = new Queue();
    this.exorciseQueue = new Queue();
    this.revealQueue = new Queue();
    this.pregame = this.createMeeting(PregameMeeting);
    this.meetings = {
      [Symbol.iterator]: () => {
        var i = 0;
        var meetings = this.getMeetings();

        return {
          next: () => {
            if (i >= meetings.length) return { done: true };

            return { value: meetings[i++], done: false };
          },
        };
      },
    };
    this.processingActionQueue = false;
    this.banned = {};
    this.createTime = Date.now();
    this.finished = false;
    this.rehostId = options.settings.rehostId;
    this.scheduled = options.settings.scheduled;
    this.timeouts = [];
    this.isTest = options.isTest;

    this.anonymousGame = options.settings.anonymousGame;
    this.anonymousDeck = options.settings.anonymousDeck;
    this.beforeAnonPlayerInfo = [];
    this.anonPlayerMapping = {};
    this.pointsEarnedByPlayers = {};

    this.numHostInGame = 0;
    this.originalHostId = options.hostId; // Track the original host for reassignment
  }

  async init() {
    try {
      await redis.createGame(this.id, {
        type: this.type,
        port: this.port,
        status: "Open",
        hostId: this.hostId,
        lobby: this.lobby,
        settings: {
          setup: this.setup.id,
          total: this.setup.total,
          lobbyName: this.lobbyName,
          private: this.private,
          guests: this.guests,
          ranked: this.ranked,
          competitive: this.competitive,
          rehostId: this.rehostId,
          scheduled: this.scheduled,
          spectating: this.spectating,
          readyCheck: this.readyCheck,
          noVeg: this.noVeg,
          stateLengths: this.stateLengths,
          anonymousGame: this.anonymousGame,
          anonymousDeck: this.anonymousDeck,
          gameTypeOptions: this.getGameTypeOptions(),
        },
        createTime: this.createTime,
      });

      if (!this.scheduled) {
        await redis.joinGame(
          this.hostId,
          this.id,
          this.ranked,
          this.competitive
        );
        this.startHostingTimer();
      } else {
        await redis.setHostingScheduled(this.hostId, this.id);
        this.queueScheduleNotifications();
      }
    } catch (e) {
      logger.error(e);
      // this.handleError(e);
    }
  }

  async handleError(e) {
    var stack = e.stack.split("\n").slice(0, 6).join("\n");
    const discordAlert = JSON.parse(process.env.DISCORD_ERROR_HOOK);
    await axios({
      method: "post",
      url: discordAlert.hook,
      data: {
        content: `Error stack: \`\`\` ${stack}\`\`\`\nSetup: ${this.setup.name} (${this.setup.id})\nGame Link: ${process.env.BASE_URL}/game/${this.id}/review`,
        username: "Errorbot",
        attachments: [],
        thread_name: `Game Error! ${e}`,
      },
    });
  }

  async cancel() {
    for (let timeout of this.timeouts) clearTimeout(timeout);

    delete games[this.id];
    await redis.deleteGame(this.id);
  }

  startHostingTimer() {
    this.createTimer(
      "pregameWait",
      this.pregameWaitLength * 60 * 60 * 1000,
      () => {
        this.sendAlert(
          "Waited too long to start…This game will be closed in the next 30 seconds."
        );

        this.createTimer("pregameWait", 30 * 1000, () => {
          for (let p of this.players) {
            this.kickPlayer(p);
          }
        });
      }
    );
  }

  broadcast(eventName, data) {
    for (let player of this.players) player.send(eventName, data);

    for (let spectator of this.spectators) spectator.send(eventName, data);
  }

  sendAlert(message, recipients, extraStyle = {}, tags = []) {
    message = new Message({
      content: message,
      recipients: recipients,
      tags: tags,
      game: this,
      isServer: true,
      extraStyle: extraStyle,
    });

    message.send();
  }

  processAlertQueue() {
    for (let item of this.alertQueue)
      this.sendAlert(item.message, item.recipients, undefined, item.tags);

    this.alertQueue.empty();
  }

  queueAlert(message, priority, recipients, tags = []) {
    priority = priority || 0;
    this.alertQueue.enqueue({ message, priority, recipients, tags });
  }

  addToObituary(playerId, snippetKey, text) {
    if (!this.obituaryQueue[playerId]) {
      this.obituaryQueue[playerId] = {
        snippets: {},
      };
    }
    this.obituaryQueue[playerId].snippets[snippetKey] = text;
  }

  processObituaryQueue(source) {
    const obituaries = [];

    for (let playerId in this.obituaryQueue) {
      const obituary = this.obituaryQueue[playerId];
      delete this.obituaryQueue[playerId];

      const player = this.getPlayer(playerId);

      obituary.id = player.id;
      obituary.playerInfo = player.getPlayerInfo();

      if (!player.alive) {
        obituaries.push(obituary);
      }
    }

    const obituariesMessage = {
      id: `${this.currentState}:${source}`,
      obituaries: obituaries,
      source: source,
      time: Date.now(),
      dayCount: "dayCount" in this ? this.dayCount - 1 : 0,
    };

    if (obituaries.length > 0 || source === "Night") {
      this.history.addObituaries(obituariesMessage);
      this.addObituaries(obituariesMessage);
      this.broadcast("obituaries", obituariesMessage);
    }
  }

  processDeathQueue() {
    for (let item of this.deathQueue) {
      this.recordDead(item.player, item.dead);

      if (item.dead && !item.player.alive)
        this.broadcast("death", item.player.id);
      else if (!item.dead && item.player.alive)
        this.broadcast("revival", item.player.id);
    }

    this.deathQueue.empty();
  }

  processExorciseQueue() {
    for (let item of this.exorciseQueue) {
      this.recordExorcised(item.player, item.exorcised);

      if (item.exorcised && !item.player.alive)
        this.broadcast("exorcised", item.player.id);
    }

    this.exorciseQueue.empty();
  }

  queueDeath(player) {
    player.alive = false;
    this.deathQueue.enqueue({ player, dead: true });
  }

  queueRevival(player) {
    player.alive = true;
    this.deathQueue.enqueue({ player, dead: false });
  }

  processRevealQueue() {
    for (let item of this.revealQueue) {
      this.recordRole(item.player, item.appearance);
      this.broadcast("reveal", {
        playerId: item.player.id,
        role: item.appearance,
      });
    }

    this.revealQueue.empty();
  }

  queueReveal(player, appearance) {
    this.revealQueue.enqueue({ player, appearance });
  }

  getPlayer(playerId) {
    return this.players[playerId];
  }

  getMeeting(meetingId, state) {
    state = state == null ? this.currentState : state;
    return this.history.states[state].meetings[meetingId];
  }

  getMeetingByName(name) {
    return this.history.getMeetings().filter((m) => m.name == name)[0];
  }

  getMeetings() {
    return this.history.getMeetings();
  }

  getSetupInfo() {
    return this.setup;
  }

  async userJoin(user, isBot) {
    try {
      var currentGame;

      if (!isBot) currentGame = await redis.inGame(user.id);

      // Check if user is already in a different game
      if (currentGame && currentGame != this.id) {
        user.send(
          "error",
          "You must leave your current game before joining a new one."
        );
        user.socket.terminate();
        return;
      }

      var player;

      // Find existing player in this game with same user
      if (!isBot && (!this.started || !this.anonymousGame)) {
        for (let p of this.players) {
          if (p.user.id == user.id) {
            player = p;
            break;
          }
        }
      } else if (!isBot && this.started && this.anonymousGame) {
        if (this.anonPlayerMapping[user.id]) {
          player = this.anonPlayerMapping[user.id];
        }
      } else {
        for (let p of this.players) {
          if (
            user.guestId &&
            p.user.guestId &&
            p.user.guestId == user.guestId
          ) {
            player = p;
            break;
          }
        }
      }

      // Reconnect to game if user is already in it
      if (player && !player.left) {
        player = player.setUser(user);

        // If the original host is reconnecting and host status was reassigned, restore it
        if (
          user.id === this.originalHostId &&
          this.hostId !== this.originalHostId &&
          !this.started
        ) {
          const oldHostId = this.hostId;
          this.hostId = this.originalHostId;
          await redis.setGameHost(this.id, this.hostId);
          this.sendAlert(
            `${player.name} has reconnected and is now hosting.`,
            undefined,
            undefined,
            ["info"]
          );
          this.broadcast("hostId", this.hostId);
          logger.info(
            `Game ${this.id}: Original host ${this.hostId} reconnected, host restored from ${oldHostId}`
          );
        }

        this.sendAllGameInfo(player);
        player.send("loaded");
        return;
      }

      // Join the game as a new player if possible
      await this.joinMutexLock();
      if (
        !player &&
        this.currentState == -1 &&
        this.players.length < this.setup.total &&
        !this.banned[user.id]
      ) {
        await redis.joinGame(user.id, this.id, this.ranked, this.competitive);

        player = new this.Player(user, this, isBot);
        player.init();

        if (this.playersGone[user.id]) {
          player.id = this.playersGone[user.id].id;
          player.joinTime =
            this.playersGone[user.id].joinTime || player.joinTime;
          delete this.playersGone[user.id];
        }

        const timeLeft = Math.round(
          this.getTimeLeft("pregameWait") / 1000 / 60
        );
        this.players.push(player);

        // If the original host is rejoining, restore their host status
        if (
          user.id === this.originalHostId &&
          this.hostId !== this.originalHostId
        ) {
          const oldHostId = this.hostId;
          this.hostId = this.originalHostId;
          await redis.setGameHost(this.id, this.hostId);
          this.sendAlert(
            `${player.name} has returned and is now hosting.`,
            undefined,
            undefined,
            ["info"]
          );
          this.broadcast("hostId", this.hostId);
          logger.info(
            `Game ${this.id}: Original host ${this.hostId} returned, host restored from ${oldHostId}`
          );
        }

        this.joinMutexUnlock();
        this.sendPlayerJoin(player);
        this.pregame.join(player);
        this.sendAllGameInfo(player);
        player.send("loaded");
        this.checkGameStart();
        return;
      } else this.joinMutexUnlock();

      const canSpectateAny = await routeUtils.verifyPermission(
        user.id,
        "canSpectateAny"
      );

      // Check if spectating is allowed
      if (!this.spectating && !canSpectateAny) {
        user.send("error", "Spectating is not enabled for this game");
        return;
      }

      var spectator;

      // Find existing spectator with same user
      for (let s of this.spectators) {
        if (s.user.id == user.id) {
          spectator = s;
          break;
        }
      }

      // Reconnect if already a spectator
      if (spectator) {
        spectator.setUser(user);
        this.sendAllGameInfo(spectator);
        spectator.send("loaded");
        return;
      }

      // Check if spectator limit is reached
      if (this.spectators.length >= this.spectatorLimit && !canSpectateAny) {
        user.send("error", "Spectator limit reached");
        return;
      }

      // Join as a new spectator
      spectator = new Spectator(user, this);
      spectator.init();

      this.spectators.push(spectator);
      this.sendAllGameInfo(spectator);
      spectator.send("loaded");

      this.broadcast("spectatorCount", this.spectators.length);
      redis.setSpectatorCount(this.id, this.spectators.length);
    } catch (e) {
      logger.error(e);
      // this.handleError(e);
    }
  }

  joinMutexLock() {
    return new Promise((res, rej) => {
      if (!this.joinMutex) {
        this.joinMutex = true;
        res();
      } else {
        var count = 0;
        var lockInt = setInterval(() => {
          if (!this.joinMutex) {
            this.joinMutex = true;
            clearInterval(lockInt);
            res();
          } else {
            count++;

            if (count == 100) rej();
          }
        }, 100);
      }
    });
  }

  joinMutexUnlock() {
    this.joinMutex = false;
  }

  async userLeave(userId) {
    var player;

    for (let p of this.players) {
      if (p.user.id == userId) {
        player = p;
        break;
      }
    }

    if (!player && userId != this.hostId) return;
    else if (!player) {
      await redis.leaveGame(userId);

      if (this.players.length == 0) {
        delete games[this.id];
        await redis.deleteGame(this.id);
      }

      return;
    }

    this.playerLeave(player);

    if (player.alive)
      this.sendAlert(`${player.name} has left.`, undefined, undefined, [
        "info",
      ]);
  }

  async playerLeave(player) {
    player.send("left");
    player.left = true;
    player.user.disconnect();

    if (!this.started && this.players[player.id]) {
      this.cancelReadyCheck();
      this.pregame.leave(player);
      this.broadcast("playerLeave", player.id);

      const wasHost = player.user.id === this.hostId;

      delete this.players[player.id];
      this.playersGone[player.user.id] = this.createPlayerGoneObj(player);

      if (this.players.length == 0) {
        await this.cancel();
        return;
      }

      // Reassign host if the current host left during pregame
      if (wasHost) {
        await this.reassignHost();
      }
    } else {
      if (this.started && !this.finished && player.alive) {
        this.makeUnranked();
        this.makeUncompetitive();

        if (this.breakIntegrity()) {
          if (!player.isBot) {
            const userId = player.userId || player.user.id;
            this.penalizePlayerForLeaving(userId);
          }
        }
      }

      if (!this.postgameOver && this.players[player.id]) {
        var remainingPlayer = false;

        for (let player of this.players) {
          if (!player.left) {
            remainingPlayer = true;
            break;
          }
        }

        if (!remainingPlayer) {
          await this.onAllPlayersLeft();
          return;
        }
      }
    }

    // In the event of a guiser swap, the userId that is needed to leave is
    // the target. However, the `player` in this game is the still alive disguiser
    // Therefore, if the swapped user is not null, then we need to use that person's ID
    let userIdToLeave = player.user.id;
    if (player.user.swapped) {
      userIdToLeave = player.user.swapped.id;
    }
    await redis.leaveGame(userIdToLeave);
  }

  async onAllPlayersLeft() {
    if (!this.finished) this.immediateEnd();
    else if (!this.postgameOver) this.endPostgame();
  }

  async vegPlayer(player) {
    if (player.hasEffect("Unveggable")) return;
    if (player.left) return;
    this.makeUnranked();
    this.makeUncompetitive();

    if (this.breakIntegrity()) {
      if (!player.isBot) {
        const userId = player.userId || player.user.id;
        this.penalizePlayerForLeaving(userId);
      }
    }

    this.queueAction(
      new Action({
        actor: player,
        target: player,
        priority: -999,
        game: this,
        labels: ["hidden", "absolute", "uncontrollable"],
        run: function () {
          if (this.target.hasEffect("Unveggable")) {
            return;
          }
          this.target.kill("veg", this.actor);
          this.game.exorcisePlayer(this.actor);
        },
      })
    );
  }

  exorcisePlayer(player) {
    player.exorcised = true;
    this.events.emit("exorcise", player);
    this.exorciseQueue.enqueue({ player, exorcised: true });
    this.spectatorLimit = this.spectatorLimit + 1;
    var spectator = new Spectator(player.user, this);
    spectator.init();

    this.spectators.push(spectator);
    this.sendAllGameInfo(spectator);
    spectator.send("loaded");

    this.broadcast("spectatorCount", this.spectators.length);
    redis.setSpectatorCount(this.id, this.spectators.length);
  }

  // Returns if the integrity of the game was broken for the first time or not
  breakIntegrity() {
    const hadIntegrity = this.hasIntegrity;
    this.hasIntegrity = false;

    if (hadIntegrity) {
      this.queueAlert("The game is now safe to leave without penalty.");
    }

    return hadIntegrity;
  }

  makeUnranked() {
    const wasRanked = this.ranked;
    this.ranked = false;

    if (wasRanked) {
      this.queueAlert("The game is now unranked.");
    }
  }

  makeUncompetitive() {
    const wasCompetitive = this.competitive;
    this.competitive = false;

    if (wasCompetitive) {
      this.queueAlert("The game is now unranked.");
    }
  }

  createPlayerGoneObj(player) {
    return {
      id: player.id,
      userId: player.user.id,
      name: player.name,
      avatar: player.user.avatar,
      emojis: player.user.emojis,
      textColor: player.user.textColor,
      nameColor: player.user.nameColor,
      customEmotes: player.user.customEmotes,
      alive: player.alive,
      left: true,
      joinTime: player.joinTime, // Preserve join time for host reassignment
    };
  }

  removeSpectator(spectator) {
    this.spectators.splice(this.spectators.indexOf(spectator), 1);
    this.broadcast("spectatorCount", this.spectators.length);
    redis.setSpectatorCount(this.id, this.spectators.length);
  }

  async kickPlayer(player, permanent) {
    if (this.started) return;

    if (permanent) this.banned[player.user.id] = true;

    await this.playerLeave(player);
  }

  async reassignHost() {
    // Find the player who has been in the game the longest (earliest joinTime)
    let nextHost = null;
    let earliestJoinTime = Infinity;

    for (let player of this.players) {
      if (player.joinTime < earliestJoinTime) {
        earliestJoinTime = player.joinTime;
        nextHost = player;
      }
    }

    if (nextHost) {
      const oldHostId = this.hostId;
      this.hostId = nextHost.user.id;

      // Update host in Redis
      await redis.setGameHost(this.id, this.hostId);

      // Notify all players of the host change
      this.sendAlert(`${nextHost.name} is now hosting.`, undefined, undefined, [
        "info",
      ]);

      // Broadcast updated host info to all players
      this.broadcast("hostId", this.hostId);

      logger.info(
        `Game ${this.id}: Host reassigned from ${oldHostId} to ${this.hostId}`
      );

      return true;
    }

    return false;
  }

  alivePlayers() {
    return this.players.filter((p) => p.alive);
  }

  deadPlayers() {
    return this.players.filter((p) => !p.alive);
  }

  getAllPlayerInfo(recipient) {
    var allPlayerInfo = {};

    for (let player of this.players)
      allPlayerInfo[player.id] = player.getPlayerInfo(recipient);

    for (let userId in this.playersGone) {
      let player = this.playersGone[userId];
      allPlayerInfo[player.id] = player;
    }

    for (let playerInfo of this.beforeAnonPlayerInfo) {
      allPlayerInfo[playerInfo.id] = playerInfo;
    }

    return allPlayerInfo;
  }

  sendAllGameInfo(player) {
    player.sendSelf();
    player.send("players", this.getAllPlayerInfo(player));
    player.send("options", {
      lobby: this.lobby,
      private: this.private,
      ranked: this.ranked,
      competitive: this.competitive,
      spectating: this.spectating,
      guests: this.guests,
      stateLengths: this.stateLengths,
      gameTypeOptions: this.getGameTypeOptions(),
      anonymousGame: this.anonymousGame,
      anonymousDeck: this.anonymousDeck,
    });
    player.sendHistory();
    player.sendStateInfo();
    player.send("stateEvents", Object.keys(this.stateEvents));
    player.sendSelfWill();
    player.send("setup", this.getSetupInfo());
    player.send("emojis", this.emojis);
    player.send("isStarted", this.started);
    player.send("spectatorCount", this.spectators.length);

    if (!player.user.playedGame && !player.isBot) player.send("firstGame");

    if (player.user.dev && !player.isBot) player.send("dev");

    this.sendTimersToPlayer(player);
    this.syncPlayerTimers(player);
  }

  sendPlayerJoin(newPlayer) {
    for (let player of this.players) {
      if (player != newPlayer)
        player.send("playerJoin", newPlayer.getPlayerInfo(player));
    }
    this.sendAlert(`${newPlayer.name} has joined.`, undefined, undefined, [
      "info",
    ]);
    if (newPlayer.user && newPlayer.user.Protips == false) {
      let allTips = protips[this.type].filter((p) => p);
      for (let tip of protips["Any"]) {
        allTips.push(tip);
      }
      //allTips = allTips.push(protips["Any"]);
      newPlayer.sendAlert(
        `Protip: ${Random.randArrayVal(allTips)}`,
        undefined,
        { color: " #cc57f7" }
      );
    }
  }

  sendStateEventMessages() {
    for (let stateEvent in this.stateEvents) {
      var message = this.stateEventMessages(stateEvent);

      if (this.stateEvents[stateEvent] && message) this.queueAlert(message);
    }
  }

  checkGameStart() {
    if (this.players.length == this.setup.total) {
      if (!this.isTest) {
        if (this.readyCheck) this.startReadyCheck();
        else this.startPregameCountdown();
      } else this.start();
    }
  }

  startReadyCheck() {
    this.readyMeeting = this.createMeeting(PregameReadyMeeting);

    for (let player of this.players) this.readyMeeting.join(player);

    this.readyMeeting.init();

    for (let player of this.players) player.sendMeeting(this.readyMeeting);

    this.createTimer("pregameCountdown", this.readyCountdownLength, () =>
      this.failReadyCheck()
    );
    this.sendAlert("Game filled, @everyone please ready up to start the game.");
  }

  cancelReadyCheck() {
    this.clearTimer("pregameCountdown");

    if (this.readyMeeting) this.readyMeeting.cancel();
  }

  failReadyCheck() {
    for (let member of this.readyMeeting.members) {
      if (!member.ready) {
        this.kickPlayer(member.player);
        this.sendAlert(
          `${member.player.name} was kicked for inactivity.`,
          undefined,
          undefined,
          ["info"]
        );
      }
    }

    this.cancelReadyCheck();
  }

  startPregameCountdown() {
    this.clearTimer("pregameCountdown");
    this.createTimer("pregameCountdown", this.pregameCountdownLength, () =>
      this.start()
    );
  }

  start() {
    // Set game in progress in redis db
    redis.setGameStatus(this.id, "In Progress");

    // Record start time
    this.startTime = Date.now();
    this.clearTimer("pregameWait");

    // Tell clients the game started, assign roles, and move to the next state
    this.assignRoles();
    this.started = true;
    this.broadcast("start");
    this.events.emit("start");

    // Got to initial state
    this.calculateStateOffset();
    this.gotoNextState();
  }

  generateClosedRoleset() {
    if (this.setup.useRoleGroups) {
      return this.generateClosedRolesetUsingRoleGroups();
    }

    var roleset = {};
    var rolesByAlignment = {};
    this.banishedRoles = [];
    this.PossibleRoles = [];
    this.PossibleEvents = [];
    this.CurrentEvents = [];
    this.BanishedEvents = [];

    for (let role in this.setup.roles[0]) {
      let roleName = role.split(":")[0];
      let isBanished =
        role.split(":")[1] &&
        role.split(":")[1].toLowerCase().includes("banished");
      let isEvent = this.getRoleAlignment(roleName) == "Event";
      const roleFromRoleData = roleData[this.type][roleName];
      if (!roleFromRoleData) {
        this.sendAlert(
          `Failed to start game with invalid role: ${roleName}. We would appreciate if you can make a bug report.`
        );
        return;
      }

      let alignment = roleFromRoleData.alignment;
      if (!isEvent) {
        this.PossibleRoles.push(role);
      }
      if (!isBanished && !isEvent) {
        if (!rolesByAlignment[alignment]) rolesByAlignment[alignment] = [];

        for (let i = 0; i < this.setup.roles[0][role]; i++)
          rolesByAlignment[alignment].push(role);
      } else {
        if (!isEvent) {
          this.banishedRoles.push(role);
        } else if (!isBanished) {
          this.PossibleEvents.push(role);
        } else {
          this.BanishedEvents.push(role);
        }
      }
    }

    for (let alignment in rolesByAlignment) {
      for (let i = 0; i < this.setup.count[alignment]; i++) {
        let role = Random.randArrayVal(rolesByAlignment[alignment]);

        if (this.setup.unique && this.setup.uniqueWithoutModifier) {
          rolesByAlignment[alignment] = rolesByAlignment[alignment].filter(
            (_role) => _role.split(":")[0] != role.split(":")[0]
          );
        } else if (this.setup.unique && !this.setup.uniqueWithoutModifier) {
          rolesByAlignment[alignment] = rolesByAlignment[alignment].filter(
            (_role) => _role != role
          );
        }

        if (roleset[role] == null) roleset[role] = 0;

        roleset[role]++;
      }
    }
    this.CurrentEvents = this.PossibleEvents.filter((e) => e);
    return roleset;
  }

  generateClosedRolesetUsingRoleGroups() {
    let finalRoleset = {};
    this.banishedRoles = [];
    this.PossibleRoles = [];
    this.PossibleEvents = [];
    this.CurrentEvents = [];
    this.BanishedEvents = [];

    for (let i in this.setup.roles) {
      let size = this.setup.roleGroupSizes[i];
      let roleset = this.setup.roles[i];

      // has common logic with generatedClosedRoleset, can be refactored in future
      let rolesetArray = [];
      for (let role in roleset) {
        let isBanished =
          role.split(":")[1] &&
          role.split(":")[1].toLowerCase().includes("banished");
        let isEvent = this.getRoleAlignment(role.split(":")[0]) == "Event";
        if (!isEvent) {
          this.PossibleRoles.push(role);
        }
        if (!isBanished && !isEvent) {
          for (let i = 0; i < roleset[role]; i++) {
            rolesetArray.push(role);
          }
        } else {
          if (!isEvent) {
            this.banishedRoles.push(role);
          } else if (!isBanished) {
            this.PossibleEvents.push(role);
          } else {
            this.BanishedEvents.push(role);
          }
        }
      }

      for (let i = 0; i < size; i++) {
        let role = Random.randArrayVal(rolesetArray);

        if (this.setup.unique && this.setup.uniqueWithoutModifier) {
          rolesetArray = rolesetArray.filter(
            (_role) => _role.split(":")[0] != role.split(":")[0]
          );
        } else if (this.setup.unique && !this.setup.uniqueWithoutModifier) {
          rolesetArray = rolesetArray.filter((_role) => _role != role);
        }

        if (finalRoleset[role] == null) finalRoleset[role] = 0;

        finalRoleset[role]++;
      }
    }
    this.CurrentEvents = this.PossibleEvents.filter((e) => e);
    return finalRoleset;
  }

  patchRenamedRoles() {
    // patch this.setup.roles
    let mappedRoles = renamedRoleMapping[this.type];
    let mappedModifiers = renamedModifierMapping[this.type];
    if (!mappedRoles && !mappedModifiers) return;

    for (let j in this.setup.roles) {
      let roleSet = this.setup.roles[j];
      let newRoleSet = {};
      for (let originalRoleName in roleSet) {
        let [roleName, modifiers] = originalRoleName.split(":");

        var newName = "";
        if (!modifiers || modifiers.length == 0) {
          newName = mappedRoles[roleName] || roleName;
        } else {
          let modifierNames = modifiers.split("/");
          let newModifierNames = [];
          for (let originalModifierName of modifierNames) {
            let newModifierName =
              mappedRoles[originalModifierName] || originalModifierName;
            newModifierNames.push(newModifierName);
          }
          const newModifierNamesString = newModifierNames.join("/");
          let newRoleName = mappedRoles[roleName] || roleName;
          newName = [newRoleName, newModifierNamesString].join(":");
        }

        if (!newRoleSet[newName]) newRoleSet[newName] = 0;

        newRoleSet[newName] += roleSet[originalRoleName];
      }
      this.setup.roles[j] = newRoleSet;
    }
    return;
  }

  generateRoleset() {
    this.patchRenamedRoles();
    var roleset;
    this.PossibleRoles = [];
    this.banishedRoles = [];
    this.PossibleEvents = [];
    this.CurrentEvents = [];
    this.BanishedEvents = [];

    for (let i in this.setup.roles) {
      roleset = this.setup.roles[i];

      for (let role in roleset) {
        for (let i = 0; i < roleset[role]; i++) {
          let roleName = role.split(":")[0];
          let isBanished =
            role.split(":")[1] &&
            role.split(":")[1].toLowerCase().includes("banished");
          let isEvent = this.getRoleAlignment(roleName) == "Event";
          if (isEvent) {
            if (isBanished) this.BanishedEvents.push(role);
            else this.PossibleEvents.push(role);
          } else {
            if (isBanished) {
              this.banishedRoles.push(role);
            }
            this.PossibleRoles.push(role);
          }
        }
      }
    }

    if (!this.setup.closed)
      roleset = { ...Random.randArrayVal(this.setup.roles) };
    else roleset = this.generateClosedRoleset();

    return roleset;
  }

  makeGameAnonymous() {
    if (this.anonymousDeck.length == 1) {
      this.queueAlert(
        `Randomising names with deck: ${this.anonymousDeck[0].name}`
      );
    } else {
      let Decknames = this.anonymousDeck.map((d) => d.name);
      this.queueAlert(`Randomising names with decks: ${Decknames.join(", ")}`);
    }
    //this.queueAlert(`Randomising names with decks: ${this.anonymousDeck.length}`);
    let deckProfiles = [];
    for (let deck of this.anonymousDeck) {
      deckProfiles = deckProfiles.concat(deck.profiles);
    }
    for (let profile of deckProfiles) {
      for (let profile2 of deckProfiles) {
        profile.id = deckProfiles.indexOf(profile);
        if (profile != profile2 && profile.name == profile2.name) {
          deckProfiles = deckProfiles.filter((p) => p != profile2);
        }
      }
    }
    deckProfiles = Random.randomizeArray(deckProfiles);
    let deckIndex = 0;

    for (let playerId in this.players) {
      let p = this.players[playerId];
      // save mapping for front-end render
      this.beforeAnonPlayerInfo.push(this.createPlayerGoneObj(p));

      p.makeAnonymous(deckProfiles[deckIndex]);
      deckIndex++;
      this.players[p.id] = p;

      // save mapping for reconnect
      this.anonPlayerMapping[p.originalProfile.userId] = p;
    }

    // shuffle player order
    let randomPlayers = Random.randomizeArray(this.players.array());
    this.players = new ArrayHash();
    randomPlayers.map((p) => this.players.push(p));

    for (let p of this.players) {
      p.sendSelf();
      p.send("players", this.getAllPlayerInfo(p));
    }
  }

  assignRoles() {
    if (this.anonymousGame) {
      this.makeGameAnonymous();
    }

    var roleset = this.generateRoleset();
    let players = this.players.array();
    this.StartingRoleset = [];
    for (let r in roleset) {
      if (
        r.split(":")[1] &&
        r.split(":")[1].toLowerCase().includes("banished")
      ) {
        continue;
      }
      if (this.getRoleAlignment(r) == "Event") {
        continue;
      }
      if (r.split(":")[1]) {
        this.StartingRoleset.push(`${r.split(":")[0]}:${r.split(":")[1]}`);
      } else {
        this.StartingRoleset.push(`${r.split(":")[0]}:`);
      }
    }
    //this.sendAlert(`${this.StartingRoleset.join(", ")}`);
    /*
    if (
      this.setup.AllExcessRoles &&
      this.PossibleRoles &&
      this.type == "Mafia"
    ) {
      let AllRoles = Object.entries(roleData.Mafia)
        .filter((m) => m[1].alignment != "Event")
        .map((r) => r[0]);
      this.PossibleRoles = this.PossibleRoles.concat(AllRoles);
    }
    */
    // force assign "Host" role to the current game host
    let hostCount = 0;
    let toDelete = [];
    for (let roleName in roleset) {
      let role = roleName.split(":")[0];
      let modifiers = roleName.split(":")[1];
      if (this.getRoleAlignment(role) == "Event") {
        toDelete.push(roleName);
        if (!this.BanishedEvents.includes(roleName)) {
          this.CurrentEvents.push(roleName);
        }
      } else if (modifiers && modifiers.toLowerCase().includes("banished")) {
        toDelete.push(roleName);
      }
      if (role != "Host") {
        continue;
      }
      this.HaveHostingState = true;
      // Assign Host role(s) to the current game host first
      for (let j = 0; j < roleset[roleName]; j++) {
        if (j === 0) {
          // Find the current host player
          let hostPlayer = players.find((p) => p.user.id === this.hostId);
          if (hostPlayer) {
            hostPlayer.setRole(roleName);
            hostCount += 1;
          } else {
            // Fallback to first player if host not found
            players[hostCount].setRole(roleName);
            hostCount += 1;
          }
        } else {
          // Additional Host roles go to subsequent players
          players[hostCount].setRole(roleName);
          hostCount += 1;
        }
      }

      toDelete.push(roleName);
    }
    toDelete.map((r) => delete roleset[r]);

    this.numHostInGame = hostCount;
    let remainingToAssign = players.slice(hostCount);
    var randomPlayers = Random.randomizeArray(remainingToAssign);

    var i = 0;
    this.originalRoles = {};

    if (
      this.HaveHostingState &&
      this.type == "Mafia" &&
      this.advancedHosting == true
    ) {
      for (let player of randomPlayers) {
        player.setRole("Contestant", undefined, false, true, true);
      }
    } else {
      for (let roleName in roleset) {
        for (let j = 0; j < roleset[roleName]; j++) {
          let player = randomPlayers[i];
          //player.setRole(roleName);
          player.setRole(roleName, undefined, false, true, true);
          this.originalRoles[player.id] = roleName;
          i++;
        }
      }
    }
    this.SpecialInteractionRoles = [];
    this.AddedRoles = [];
    this.AddedEvents = [];
    let tempSInteraction;
    for (let z = 0; z < this.PossibleRoles.length; z++) {
      if (this.PossibleRoles[z].split(":")[0] == "Magus") {
        this.MagusPossible = true;
      }
      if (
        this.getRoleTags(this.PossibleRoles[z].split(":")[0]).includes(
          "Exorcise Village Meeting"
        )
      ) {
        this.ExorciseVillageMeeting = true;
      }
      if (this.getRoleTags(this.PossibleRoles[z]).includes("Treasure Chest")) {
        this.HaveTreasureChestState = true;
      }
      if (this.getRoleTags(this.PossibleRoles[z]).includes("Pregame Actions")) {
        this.HaveDuskOrDawn = true;
      }
      if (this.getSpecialInteractions(this.PossibleRoles[z]) != null) {
        this.SpecialInteractionRoles.push(this.PossibleRoles[z]);
      }
      if (this.getAddOtherRoles(this.PossibleRoles[z]) != null) {
        for (let role of this.getAddOtherRoles(this.PossibleRoles[z])) {
          if (role == "All Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment != "Event")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              this.AddedRoles.push(role);
            }
          } else if (role == "All Mafia Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment === "Mafia")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              this.AddedRoles.push(role);
            }
          } else if (role == "All Cult Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment === "Cult")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              this.AddedRoles.push(role);
            }
          } else {
            this.AddedRoles.push(`${role}`);
          }
        }
      }
    }
    for (let z = 0; z < this.PossibleEvents.length; z++) {
      if (this.PossibleEvents[z].split(":")[0] == "Famine") {
        this.FamineEventPossible = true;
      }
      if (
        this.getRoleTags(this.PossibleEvents[z]).includes("Pregame Actions")
      ) {
        this.HaveDuskOrDawn = true;
      }
      if (this.getSpecialInteractions(this.PossibleEvents[z]) != null) {
        this.SpecialInteractionRoles.push(this.PossibleEvents[z]);
      }
      if (this.getAddOtherRoles(this.PossibleEvents[z]) != null) {
        for (let role of this.getAddOtherRoles(this.PossibleEvents[z])) {
          if (role == "All Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment != "Event")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              this.AddedRoles.push(role);
            }
          } else if (role == "All Mafia Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment === "Mafia")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              this.AddedRoles.push(role);
            }
          } else if (role == "All Cult Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment === "Cult")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              this.AddedRoles.push(role);
            }
          } else {
            this.AddedRoles.push(`${role}`);
          }
        }
      }
    }
    for (let w = 0; w < this.AddedRoles.length; w++) {
      if (this.getAddOtherRoles(`${this.AddedRoles[w]}`) != null) {
        for (let role of this.getAddOtherRoles(this.AddedRoles[w])) {
          if (role == "All Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment != "Event")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              if (!this.AddedRoles.includes(role)) {
                this.AddedRoles.push(role);
              }
            }
          } else if (role == "All Mafia Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment === "Mafia")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              if (!this.AddedRoles.includes(role)) {
                this.AddedRoles.push(role);
              }
            }
          } else if (role == "All Cult Roles") {
            let rolesW = Object.entries(roleData.Mafia)
              .filter((roleData) => roleData[1].alignment === "Cult")
              .map((roleData) => `${roleData[0]}`);
            for (role of rolesW) {
              if (!this.AddedRoles.includes(role)) {
                this.AddedRoles.push(role);
              }
            }
          } else if (!this.AddedRoles.includes(role)) {
            this.AddedRoles.push(`${role}`);
          }
        }
      }
    }
    for (let w = 0; w < this.AddedRoles.length; w++) {
      if (this.getSpecialInteractions(`${this.AddedRoles[w]}`) != null) {
        this.SpecialInteractionRoles.push(`${this.AddedRoles[w]}`);
      }
    }

    this.PossibleRoles = this.PossibleRoles.filter(
      (r) => !r.split(":")[0].includes("Banished")
    );
    if (this.banishedRoles) {
      this.banishedRoles = this.banishedRoles.filter(
        (r) => !r.split(":")[0].includes("Banished")
      );
    }
    this.players.map((p) => this.events.emit("replaceWithBanished", p));

    this.rollQueue = [];

    while (this.rollQueue.length < 0) {
      this.events.emit("replaceWithBanished", rollQueue[0]);
      this.rollQueue.shift();
    }

    if (this.setup.closed && this.banishedRoles.length > 0) {
      this.players.map((p) => this.events.emit("addBanished", p));

      this.rollQueue = [];

      while (this.rollQueue.length < 0) {
        this.events.emit("addBanished", rollQueue[0]);
        this.rollQueue.shift();
      }

      this.players.map((p) => this.events.emit("BanishedAddOrRemove", p));

      this.rollQueue = [];

      while (this.rollQueue.length < 0) {
        this.events.emit("BanishedAddOrRemove", rollQueue[0]);
        this.rollQueue.shift();
      }

      this.players.map((p) => this.events.emit("removeBanished", p));

      this.rollQueue = [];

      while (this.rollQueue.length < 0) {
        this.events.emit("removeBanished", rollQueue[0]);
        this.rollQueue.shift();
      }
    }

    if (this.setup.closed) {
      this.players.map((p) => this.events.emit("addRequiredRole", p));

      this.rollQueue = [];

      while (this.rollQueue.length < 0) {
        this.events.emit("addRequiredRole", rollQueue[0]);
        this.rollQueue.shift();
      }

      this.players.map((p) => this.events.emit("removeRequiredRole", p));

      this.rollQueue = [];

      while (this.rollQueue.length < 0) {
        this.events.emit("removeRequiredRole", rollQueue[0]);
        this.rollQueue.shift();
      }
    }

    this.players.map((p) => this.events.emit("ReplaceAlways", p));

    this.rollQueue = [];

    while (this.rollQueue.length < 0) {
      this.events.emit("ReplaceAlways", rollQueue[0]);
      this.rollQueue.shift();
    }

    this.players.map((p) => this.events.emit("SwitchRoleBefore", p));

    this.rollQueue = [];

    while (this.rollQueue.length < 0) {
      this.events.emit("SwitchRoleBefore", rollQueue[0]);
      this.rollQueue.shift();
    }

    if (this.FamineEventPossible) {
      this.players.map((p) => p.holdItem("Bread"));
      this.players.map((p) => p.queueGetItemAlert("Bread"));
    }

    this.players.map((p) => p.role.revealToSelf(false));
    this.players.map((p) => this.events.emit("roleAssigned", p));
  }

  getRoleClass(roleName) {
    const roleFromRoleData = roleData[this.type][roleName];
    if (!roleFromRoleData) {
      this.sendAlert(
        `Failed to start game with invalid role: ${roleName}. We would appreciate if you can make a bug report.`
      );
      return;
    }

    const alignment = roleFromRoleData.alignment;
    roleName = Utils.pascalCase(roleName);
    return Utils.importGameClass(
      this.type,
      "roles",
      `${alignment}/${roleName}`
    );
  }

  getMeetingClass(meetingType) {
    if (!meetingType)
      return Utils.importGameClass(this.type, "core", "Meeting");

    meetingType = Utils.pascalCase(meetingType);
    return Utils.importGameClass(this.type, "meetings", `${meetingType}`);
  }

  calculateStateOffset() {
    let start = this.setup.startState;
    if (this.getGameSetting("Day Start")) {
      start = "Day";
    } else {
      start = "Night";
    }
    if (this.HaveHostingState == true) {
      start = "Hosting";
    } else if (this.HaveTreasureChestState == true) {
      start = "Treasure Chest";
    } else if (this.HaveDuskOrDawn == true && start == "Day") {
      start = "Dawn";
    } else if (this.HaveDuskOrDawn == true && start == "Night") {
      start = "Dusk";
    }

    if (!start) return;

    for (let i = 2; i < this.states.length; i++) {
      if (this.states[i].name == start) {
        this.stateOffset = i - 2;
        return;
      }
    }
  }

  getAllAlignments() {
    return constants.alignments[this.type];
  }

  getRoleAlignment(role) {
    return roleData[this.type][role.split(":")[0]].alignment;
  }

  getSpecialInteractions(role) {
    if (roleData[this.type][role.split(":")[0]].SpecialInteractions) {
      return roleData[this.type][role.split(":")[0]].SpecialInteractions;
    } else {
      return null;
    }
  }

  getAddOtherRoles(role) {
    if (roleData[this.type][role.split(":")[0]].RolesMadeBy) {
      return roleData[this.type][role.split(":")[0]].RolesMadeBy;
    } else {
      return null;
    }
  }

  getRoleTags(role) {
    let roleFull = role;
    let modifiers = roleFull.split(":")[1];
    if (modifiers) {
      //this.sendAlert(`Modifiers ${modifiers}`,undefined);
      modifiers = modifiers.split("/");
      if (!Array.isArray(modifiers)) {
        modifiers = [modifiers];
      }
      //this.sendAlert(`Modifiers ${modifiers}`,undefined);
    }
    let modTags;
    let roleTags = [];
    for (let tag of roleData[this.type][roleFull.split(":")[0]].tags) {
      roleTags.push(tag);
    }
    if (modifiers && modifiers.length > 0) {
      //this.sendAlert(`Modifiers Pre loop ${modifiers}`,undefined);
      for (let modifier of modifiers) {
        if (
          modifierData[this.type][modifier] &&
          modifierData[this.type][modifier].tags
        ) {
          //this.sendAlert(`Modifiers Tags ${modifierData[this.type][modifier].tags}`,undefined);
          roleTags = roleTags.concat(modifierData[this.type][modifier].tags);
          //this.sendAlert(`Role Tags ${roleTags}`,undefined);
        }
      }
    }
    /*
    if ((modifiers != null && modifiers != "") && modifiers.length > 0) {
      let modifiersArray = roleFull.split(":")[1].split("/");
      //this.sendAlert(`Set modifiersArray ${modifiersArray} Length ${modifiersArray.length}`,undefined);
      this.sendAlert(
      `Stuff Full ${roleFull} Mods Split ${roleFull.split(":")[1]} Mods ${modifiers} First Mod ${modifiersArray[0]}`,
      undefined,
      { color: "#F1F1F1" }
    );
    
      for (let w = 0; w < modifiersArray.length; w++) {
        modTags = modifierData[this.type][modifiersArray[w]].tags;
        this.sendAlert(`Set modTags ${modTags} Length ${modTags.length}`,undefined);
        for (let u = 0; u < modTags.length; u++) {
          roleTags.push(modTags[u]);
        }
      }
    }
    */
    //this.sendAlert(`return roleTags ${roleTags}`,undefined);
    return roleTags;
  }

  getEventClass(eventName) {
    eventName = Utils.pascalCase(eventName);
    eventName = eventName.split("-").join("");
    return Utils.importGameClass(this.type, "events", `${eventName}`);
  }

  checkEvent(eventName, eventMod) {
    let temp = this.createGameEvent(eventName, eventMod);
    let valid = temp.getRequirements();
    return valid;
  }

  createGameEvent(eventName, eventMods) {
    const eventClass = this.getEventClass(eventName);
    const event = new eventClass(eventMods, this);
    return event;
  }

  getAchievement(ID) {
    for (let achievement of Object.entries(gameAchievements[this.type]).filter(
      (achievementData) => ID == achievementData[1].ID
    )) {
      return `${achievement[0]}- ${achievement[1].description} (${achievement[1].reward} Coins)`;
    }
  }

  getDailyChallenge(ID, extraData) {
    for (let daily of Object.entries(dailyChallengesData).filter(
      (day) => ID == day[1].ID
    )) {
      return `${daily[0].replace(
        `ExtraData`,
        extraData
      )}- ${daily[1].description.replace(`ExtraData`, extraData)} (${
        daily[1].reward
      } Coins)`;
    }
  }

  getAchievementReward(ID) {
    for (let achievement of Object.entries(gameAchievements[this.type]).filter(
      (achievementData) => ID == achievementData[1].ID
    )) {
      return achievement[1].reward;
    }
  }

  addObituaries(obituaries) {
    for (let _player of this.players) _player.history.addObituaries(obituaries);

    this.spectatorHistory.addObituaries(obituaries);
  }

  recordRole(player, appearance) {
    for (let _player of this.players)
      _player.history.recordRole(player, appearance);

    this.spectatorHistory.recordRole(player, appearance);
  }

  recordDead(player, dead) {
    for (let _player of this.players) _player.history.recordDead(player, dead);

    this.spectatorHistory.recordDead(player, dead);
  }

  recordExorcised(player, exorcised) {
    for (let _player of this.players)
      _player.history.recordExorcised(player, exorcised);

    this.spectatorHistory.recordExorcised(player, exorcised);
  }

  gotoNextState() {
    var stateInfo = this.getStateInfo();

    // Clear current timers
    this.clearTimers();

    //Unveggable
    if (this.type == "Mafia" && this.getStateName() == "Day") {
      for (let player of this.players) {
        if (player.hasVotedInAllCoreMeetings()) {
          player.giveEffect("Unveggable");
        }
      }
    }
    // Finish all meetings and take actions
    this.finishMeetings();

    // Take snapshot of roles
    this.history.recordAllRoles();

    // Take snapshot of dead players
    this.history.recordAllDead();

    // Check if states will be skipped
    var [index, skipped] = this.getNextStateIndex();

    // Do actions
    if (!stateInfo.delayActions || skipped > 0) this.processActionQueue();

    // Check win conditions
    if (this.checkGameEnd()) return;

    const previousStateName = this.getStateName();

    // Set next state
    this.incrementState(index, skipped);
    this.stateEvents = {};
    stateInfo = this.getStateInfo();

    // Tell clients the new state
    this.addStateToHistories(stateInfo.name);
    redis.setGameState(this.id, stateInfo.name);

    this.broadcastState();
    this.events.emit("effectAge", stateInfo);
    this.events.emit("state", stateInfo);

    // Send state events
    this.addStateEventsToHistories(this.stateEvents);
    this.addStateExtraInfoToHistories(stateInfo.extraInfo);
    this.broadcast("stateEvents", Object.keys(this.stateEvents));
    this.events.emit("stateEvents", this.stateEvents);
    this.sendStateEventMessages();

    if (this.setup.gameStartPrompt && this.currentState == 0)
      [
        this.sendAlert(
          `:lore: ${this.setup.name}: ${this.setup.gameStartPrompt}`,
          undefined,
          { color: "#F1F1F1" }
        ),
      ];
    if (this.isTalkingDead() && this.currentState == 0)
      [
        this.sendAlert(
          `:rip: ${this.setup.name}: This setup is using the Talking Dead game setting so Dead Players can speak during the Village meeting!`,
          undefined,
          { color: "#F1F1F1" }
        ),
      ];
    if (this.isVotingDead() && this.currentState == 0)
      [
        this.sendAlert(
          `:rip: ${this.setup.name}: This setup is using the Voting Dead game setting so Dead Players can Vote during the Village meeting!`,
          undefined,
          { color: "#cc322d" }
        ),
      ];
    if (this.MagusPossible && this.currentState == 0) {
      [
        this.sendAlert(
          `:star: ${this.setup.name}: While many fear that the Mafia or the Cult lurk in the shadows, others aren't so sure. It is rumored that a powerful Magus has arrived in town and is responsible for the chaos. However, if the villagers are wrong and there is no Magus, the Evildoers will take advantage of the situation and wipe out the villagers!`,
          undefined,
          { color: "#d1cdab" }
        ),
      ];
    }
    if (this.ExorciseVillageMeeting && this.currentState == 0) {
      [
        this.sendAlert(
          `:scream: ${this.setup.name}: Dead players can be voted in the Village meeting. If the Poltergeist is condemned when dead they are exorcised.`,
          undefined,
          { color: " #713cfe" }
        ),
      ];
    }
    if (this.isMajorityVoting() && this.currentState == 0) {
      [
        this.sendAlert(
          `:crystal2: ${this.setup.name}: This setup is using Majority Voting! A player must get at least 50% of the vote to be condemned`,
          undefined,
          { color: " #713cfe" }
        ),
      ];
    }
    if (this.isHiddenConverts() && this.currentState == 0) {
      [
        this.sendAlert(
          `:crystal: ${this.setup.name}: This Setup is using Hidden Converts! Players who change roles will not be told about the role changes.`,
          undefined,
          { color: " #cc57f7" }
        ),
      ];
    }
    if (this.isCleansingDeaths() && this.currentState == 0) {
      [
        this.sendAlert(
          `:crystal: ${this.setup.name}: This Setup is using Cleansing Deaths! Players who die will have any malicious effects they have removed.`,
          undefined,
          { color: " #cc57f7" }
        ),
      ];
    }
    if (this.isRoleSharing() && this.currentState == 0) {
      [
        this.sendAlert(
          `:message: ${this.setup.name}: This Setup is has Role Sharing Enabled! During the day select Role Share and a player to offer a role share to them`,
          undefined,
          { color: "#F1F1F1" }
        ),
      ];
    }
    if (this.isAlignmentSharing() && this.currentState == 0) {
      [
        this.sendAlert(
          `:message: ${this.setup.name}: This Setup is has Alignment Sharing Enabled! During the day select Alignment Share and a player to offer an alignment share to them.`,
          undefined,
          { color: "#F1F1F1" }
        ),
      ];
    }
    if (this.isPrivateRevealing() && this.currentState == 0) {
      [
        this.sendAlert(
          `:message: ${this.setup.name}: This Setup has Private Revealing enabled! During the day select Private Reveal and a player to reveal your role to them.`,
          undefined,
          { color: "#F1F1F1" }
        ),
      ];
    }
    if (this.isPublicRevealing() && this.currentState == 0) {
      [
        this.sendAlert(
          `:message: ${this.setup.name}: This Setup has Public Revealing enabled! During the day select Public Reveal and a player to publicly reveal your role.`,
          undefined,
          { color: "#F1F1F1" }
        ),
      ];
    }
    /*
    if (this.setup.AllExcessRoles && this.currentState == 0) {
      [
        this.sendAlert(
          `:crystal2: ${this.setup.name}: This setup is using All Excess Roles! Every role on the Site will be considered an Excess role in this setup.`,
          undefined,
          { color: " #713cfe" }
        ),
      ];
    }
    */
    if (this.isHostileVsMafia() && this.currentState == 0) {
      [
        this.sendAlert(
          `:crystal2: ${this.setup.name}: This setup is using Hostiles Vs Mafia! Mafia/Cult will have to kill all Hostile Independents in order to win.`,
          undefined,
          { color: " #713cfe" }
        ),
      ];
    }
    if (this.isCultVsMafia() && this.currentState == 0) {
      [
        this.sendAlert(
          `:crystal2: ${this.setup.name}: This setup is using Competing Evil Factions! Mafia/Cult must remove any other evil factions in order to win.`,
          undefined,
          { color: " #713cfe" }
        ),
      ];
    }

    // Check for inactivity
    this.inactivityCheck();

    // Make meetings and send deaths, reveals, alerts
    this.processObituaryQueue(previousStateName);
    this.processDeathQueue();
    this.processExorciseQueue();
    this.processRevealQueue();
    this.makeMeetings();
    this.processAlertQueue();
    this.events.emit("meetingsMade");

    this.vegKickMeeting = undefined;

    // Create next state timer
    this.createNextStateTimer(stateInfo);
  }

  createNextStateTimer(stateInfo) {
    if (this.isTest) {
      this.createTimer("main", stateInfo.length, () => this.gotoNextState());
    } else {
      this.createTimer("main", stateInfo.length, () => this.checkVeg());
    }
    this.checkAllMeetingsReady();
  }

  checkVeg() {
    this.clearTimer("main");
    this.clearTimer("secondary");
    // after this timer, proceed to the next state
    this.createTimer("vegKickCountdown", this.vegKickCountdownLength, () =>
      this.gotoNextState()
    );

    this.vegKickMeeting = this.createMeeting(VegKickMeeting, "vegKickMeeting");

    for (let player of this.players) {
      let canKick = player.alive && player.hasVotedInAllMeetings();
      if (!canKick) {
        player.sendAlert(
          ":system: You will be kicked if you fail to take your actions."
        );
      }
      this.vegKickMeeting.join(player, canKick);
    }

    this.vegKickMeeting.init();
    this.vegKickMeeting.getKickState();

    for (let player of this.players) {
      player.sendMeeting(this.vegKickMeeting);
    }
    this.checkAllMeetingsReady();
  }

  broadcastState(stateInfo = this.getStateInfo()) {
    //this.broadcast("effectAge", stateInfo);
    this.broadcast("state", stateInfo);
  }

  addStateToHistories(name, state) {
    this.history.addState(name, state);
    this.spectatorHistory.addState(name, state);

    for (let player of this.players) player.addStateToHistory(name, state);
  }

  addStateEventsToHistories(events, state) {
    this.history.addStateEvents(events, state);
    this.spectatorHistory.addStateEvents(events, state);

    for (let player of this.players)
      player.addStateEventsToHistory(events, state);
  }

  addStateExtraInfoToHistories(extraInfo, state) {
    this.history.addStateExtraInfo(extraInfo, state);
    this.spectatorHistory.addStateExtraInfo(extraInfo, state);

    for (let player of this.players)
      player.addStateExtraInfoToHistory(extraInfo, state);
  }

  incrementState(index, skipped) {
    this.currentState++;

    if (index === undefined || skipped === undefined) {
      [index, skipped] = this.getNextStateIndex();
    }
    this.stateIndexRecord.push(index);
    return skipped;
  }

  getNextStateIndex() {
    var lastStateIndex =
      this.stateIndexRecord[this.stateIndexRecord.length - 1];
    var skipped = -1;
    var nextStateIndex, shouldSkip;

    if (lastStateIndex == null) nextStateIndex = 2 + this.stateOffset - 1;
    else nextStateIndex = lastStateIndex;

    do {
      nextStateIndex++;
      skipped++;

      if (nextStateIndex == this.states.length) nextStateIndex = 2;

      let skipChecks = this.states[nextStateIndex].skipChecks;

      if (skipChecks != null && skipChecks.length > 0) {
        shouldSkip = true;

        for (let skipCheck of skipChecks)
          shouldSkip = shouldSkip && skipCheck();
      } else shouldSkip = false;
    } while (shouldSkip);

    return [nextStateIndex, skipped];
  }

  getStateInfo(state) {
    var info;
    state = state || this.currentState;

    if (state >= 0) info = this.states[this.stateIndexRecord[state]];
    else info = this.states[state + 2];

    info.id = state;
    return info;
  }

  getPrevStateInfo() {
    return this.getStateInfo(this.currentState - 1);
  }

  getStateName(state) {
    var info = this.getStateInfo(state);
    return info.name.replace(/[0-9]*/g, "").trim();
  }

  getPrevStateName(state) {
    var info = this.getPrevStateInfo(state);
    return info.name.replace(/[0-9]*/g, "").trim();
  }

  inactivityCheck() {}

  getTime() {
    if (!this.started) return 0;

    return Math.floor(Date.now() - this.startTime);
  }

  createTimer(name, delay, then, clients) {
    this.timers[name] = new Timer({
      name,
      delay,
      then,
      game: this,
      clients,
    });
    this.timers[name].start();
  }

  getTimeLeft(timerName) {
    const timer = this.timers[timerName];
    if (!timer) {
      return 0;
    }

    return timer.timeLeft();
  }

  clearTimer(timer) {
    if (typeof timer == "string") timer = this.timers[timer];

    if (!timer) return;

    timer.clear();
    delete this.timers[timer.name];
  }

  clearTimers() {
    for (let timerName in this.timers) this.clearTimer(timerName);
  }

  syncPlayerTimers(player) {
    for (let timerName in this.timers)
      this.timers[timerName].syncClient(player);
  }

  sendTimersToPlayer(player) {
    for (let timerName in this.timers)
      if (this.timers[timerName].clients.indexOf(player) != -1)
        this.timers[timerName].sendInfoToClient(player);
  }

  addStateType(name, index, length, delayActions, shouldSkip) {
    var existingState;

    for (let state of this.states) {
      if (state.name == name) {
        existingState = state;
        break;
      }
    }

    if (!existingState) {
      this.states.splice(index, 0, {
        name,
        length,
        delayActions,
        skipChecks: [shouldSkip],
      });
    } else {
      if (existingState.skipChecks == null) existingState.skipChecks = [];

      existingState.skipChecks.push(shouldSkip);
    }
  }

  removeStateType(name) {
    for (let i in this.states) {
      if (this.states[i].name == name) {
        this.states.splice(i, 1);
        break;
      }
    }
  }

  setStateLength(name, length) {
    for (let i in this.states) {
      if (this.states[i].name == name) {
        this.states[i].length = length;
        break;
      }
    }
  }

  setStateDelayActions(name, delayActions) {
    for (let i in this.states) {
      if (this.states[i].name == name) {
        this.states[i].delayActions = delayActions;
        break;
      }
    }
  }

  setStateShouldSkip(name, shouldSkip) {
    for (let i in this.states) {
      if (this.states[i].name == name) {
        if (this.states[i].skipChecks == null) this.states[i].skipChecks = [];
        this.states[i].skipChecks.push(shouldSkip);
        break;
      }
    }
  }

  createMeeting(type, name) {
    var meeting = typeof type == "function" ? type : this.getMeetingClass(type);
    meeting = new meeting(this, name);

    this.history.addMeeting(meeting);

    if (this.isSpectatorMeeting(meeting))
      this.spectatorHistory.addMeeting(meeting);

    return meeting;
  }

  makeMeetings() {
    for (let player of this.players) player.meet();

    this.initMeetings();
    this.sendMeetings();
  }

  initMeetings() {
    for (let meeting of this.meetings) meeting.init();
  }

  sendMeetings(players) {
    players = players || this.players;
    for (let player of players) player.sendMeetings();

    this.sendSpectatorMeetings();
  }

  removeMeeting(meeting) {
    this.history.removeMeeting(meeting);
  }

  checkAllMeetingsReady() {
    var allReady = true;

    if (this.type == "Mafia" && this.getStateName() == "Day") {
      for (let meeting of this.meetings) {
        let extraConditionDuringKicks = true;
        if (this.vegKickMeeting !== undefined) {
          extraConditionDuringKicks =
            meeting.name !== "Vote Kick" && !meeting.noVeg;
        }

        // during kicks, we need to exclude the votekick and noveg meetings
        if (meeting.Important != true) {
          continue;
        }
        if (!meeting.ready && extraConditionDuringKicks) {
          allReady = false;
          break;
        }
      }
      if (allReady) {
        for (let player of this.players) {
          if (player.hasVotedInAllCoreMeetings()) {
            player.giveEffect("Unveggable");
          }
        }
        this.gotoNextState();
      }
    }

    for (let meeting of this.meetings) {
      let extraConditionDuringKicks = true;
      if (this.vegKickMeeting !== undefined) {
        extraConditionDuringKicks =
          meeting.name !== "Vote Kick" && !meeting.noVeg;
      }

      // during kicks, we need to exclude the votekick and noveg meetings
      if (!meeting.ready && extraConditionDuringKicks) {
        allReady = false;
        break;
      }
    }

    if (allReady) this.gotoNextState();
  }

  finishMeetings() {
    for (let meeting of this.meetings) if (!meeting.finished) meeting.finish();
  }

  isSpectatorMeeting(meeting) {
    return (
      this.spectatorMeetFilter[meeting.name] ||
      (this.spectatorMeetFilter["*"] &&
        this.spectatorMeetFilter[meeting.name] != false)
    );
  }

  sendSpectatorMeetings() {
    for (let spectator of this.spectators) spectator.sendMeetings();
  }

  spectatorsHear(message) {
    let isTalkingDead = this.isTalkingDead();

    if (message.sender && !message.sender.alive && !isTalkingDead) {
      return;
    }
    if (message.abilityName != "Whisper") {
      for (let spectator of this.spectators) spectator.hear(message);
    }
  }

  spectatorsHearQuote(quote) {
    for (let spectator of this.spectators) spectator.hearQuote(quote);
  }

  spectatorsSeeVote(vote) {
    for (let spectator of this.spectators) spectator.seeVote(vote);
  }

  spectatorsSeeUnvote(info) {
    for (let spectator of this.spectators) spectator.seeUnvote(info);
  }

  queueAction(action, instant) {
    var delay = action.delay;

    if (this.processingActionQueue && !instant) {
      delay++;
    }

    while (this.actions.length <= delay) this.actions.push(new Queue());

    this.actions[delay].enqueue(action);
  }

  dequeueAction(action, force) {
    for (let i in this.actions) {
      if (!force && this.processingActionQueue && i == 0) continue;

      this.actions[i].remove(action);
    }
  }

  processActionQueue() {
    for (let player of this.players) player.queueNonmeetActions();

    this.events.emit("actionsNext", this.actions[0]);
    this.processingActionQueue = true;

    for (let action of this.actions[0]) action.do();

    this.events.emit("afterActions");
    this.actions.push(new Queue());

    for (let i = 1; i < this.actions.length; i++)
      this.actions[i - 1] = this.actions[i];

    this.actions.pop();
    this.processingActionQueue = false;
  }

  instantAction(action, meeting) {
    this.events.emit("instantAction", action);
    action.do();

    if (this.checkGameEnd()) return;

    this.checkAllMeetingsReady();
    this.processDeathQueue();
    this.processExorciseQueue();
    this.processRevealQueue();
    this.processAlertQueue();
    this.processObituaryQueue(`instant-${Date.now()}`);
  }

  // A test branch version of this.makeMeetings()
  // will refactor into makeMeetings when stable
  instantMeeting(meetings, players) {
    for (let player of players) {
      player.joinMeetings(meetings);
    }

    for (let meetingName in meetings) {
      let toMeet = this.getMeetingByName(meetingName);
      toMeet.init();
    }

    this.sendMeetings(players);

    if (this.vegKickMeeting !== undefined) {
      this.vegKickMeeting.resetKicks();
    }
  }

  //Game Settings Section

  isDayStart() {
    if (this.getGameSetting("Day Start")) {
      return true;
    }
    return false;
  }

  isWhispers() {
    if (this.getGameSetting("Whispers")) {
      return true;
    }
    return false;
  }

  getWhisperLeakChance() {
    const leakPercentage = this.getGameSetting("Whisper Leak Chance");
    if (leakPercentage) {
      return leakPercentage;
    }
    return 0;
  }

  isMustAct() {
    if (this.getGameSetting("Must Act")) {
      return true;
    }
    return false;
  }

  isMustCondemn() {
    if (this.getGameSetting("Must Condemn")) {
      return true;
    }
    return false;
  }

  isNoReveal() {
    if (this.getGameSetting("No Reveal")) {
      return true;
    }
    return false;
  }

  isBroadcastClosedRoles() {
    if (this.getGameSetting("Broadcast Closed Roles")) {
      return true;
    }
    return false;
  }

  isAlignmentOnlyReveal() {
    if (this.getGameSetting("Alignment Only Reveal")) {
      return true;
    }
    return false;
  }

  isHiddenVotes() {
    if (this.getGameSetting("Hidden Votes")) {
      return true;
    }
    return false;
  }

  isTalkingDead() {
    if (this.getGameSetting("Talking Dead")) {
      return true;
    }
    return false;
  }

  isVotingDead() {
    if (this.getGameSetting("Voting Dead")) {
      return true;
    }
    return false;
  }

  isMajorityVoting() {
    if (this.getGameSetting("Majority Voting")) {
      return true;
    }
    return false;
  }

  isRoleSharing() {
    if (this.getGameSetting("Role Sharing")) {
      return true;
    }
    return false;
  }

  isAlignmentSharing() {
    if (this.getGameSetting("Alignment Sharing")) {
      return true;
    }
    return false;
  }

  isPrivateRevealing() {
    if (this.getGameSetting("Private Revealing")) {
      return true;
    }
    return false;
  }

  isPublicRevealing() {
    if (this.getGameSetting("Public Revealing")) {
      return true;
    }
    return false;
  }

  isHiddenConverts() {
    if (this.getGameSetting("Hidden Conversions")) {
      return true;
    }
    return false;
  }

  isCleansingDeaths() {
    if (this.getGameSetting("Cleansing Deaths")) {
      return true;
    }
    return false;
  }

  isLastWills() {
    if (this.getGameSetting("Last Wills")) {
      return true;
    }
    return false;
  }

  isHostileVsMafia() {
    if (this.getGameSetting("Hostiles Vs Mafia")) {
      return true;
    }
    return false;
  }

  isCultVsMafia() {
    if (this.getGameSetting("Competing Evil Factions")) {
      return true;
    }
    return false;
  }

  getGameSetting(gameSetting) {
    //Object.entries(gameSettingData[this.type]).map((m) => m[1].in)
    if (this.setup.gameSettings && gameSetting in this.setup.gameSettings) {
      return this.setup.gameSettings[gameSetting];
    }
    return null;
  }

  //End Game Settings Section

  isNoVeg() {
    return this.noVeg;
  }

  isNoAct() {
    return false;
  }

  isKudosEligible() {
    return this.ranked || this.competitive;
    //return true;
  }

  achievementsAllowed() {
    return this.ranked || this.competitive;
    //return true;
  }

  canChangeSetup() {
    if (this.ranked == true || this.competitive == true) {
      this.sendAlert(
        `The setup cannot be changed in ranked games.`,
        this.players.filter((p) => p.user.id == this.hostId)
      );
      return false;
    }
    if (this.started == true) {
      this.sendAlert(
        `The setup cannot be changed midgame.`,
        this.players.filter((p) => p.user.id == this.hostId)
      );
      return false;
    }
    if (this.finished == true) {
      return false;
    }
    return true;
  }

  async changeSetup(setupID) {
    if (!setupID) {
      this.sendAlert(
        `The setup not found, enter a valid Setup ID.`,
        this.players.filter((p) => p.user.id == this.hostId)
      );
      return;
    }

    if (this.canChangeSetup() != true) {
      return;
    }
    let setup = await models.Setup.findOne({
      id: setupID,
    });
    /*.select(
        "id gameType name roles closed useRoleGroups roleGroupSizes count total -_id"
      );*/
    if (setup && setup.total) {
      //setup = setup.toJSON();
      if (setup.total < this.players.length) {
        this.sendAlert(
          `The setup must have at least ${this.players.length} players.`,
          this.players.filter((p) => p.user.id == this.hostId)
        );
        return;
      }
      if (setup.gameType != this.type) {
        this.sendAlert(
          `The setup must be a ${this.type} setup.`,
          this.players.filter((p) => p.user.id == this.hostId)
        );
        return;
      }
      this.setup = setup.toJSON();
      this.setup.roles = JSON.parse(this.setup.roles);
      if (this.type == "Mafia") {
        this.noDeathLimit = this.setup.noDeathLimit;
        this.ForceMustAct = this.setup.ForceMustAct;
        this.EventsPerNight = this.setup.EventsPerNight;
        this.GameEndEvent = this.setup.GameEndEvent;
      } else if (this.type == "Texas Hold Em") {
        this.hasHost = this.setup.roles[0]["Host:"];
      } else if (this.type == "Cheat") {
        this.hasHost = this.setup.roles[0]["Host:"];
      } else if (this.type == "Liars Dice") {
        this.hasHost = this.setup.roles[0]["Host:"];
      } else if (this.type == "Resistance") {
        this.numMissions = this.setup.numMissions;
        this.teamFailLimit = this.setup.teamFailLimit;
        this.teamSizeSlope =
          (this.setup.lastTeamSize - this.setup.firstTeamSize) /
          this.numMissions;
      } else if (this.type == "Wacky Words") {
        this.hasAlien = this.setup.roles[0]["Alien:"];
        this.hasNeighbor = this.setup.roles[0]["Neighbor:"];
        this.hasGovernor = this.setup.roles[0]["Governor:"];
        this.hasGambler = this.setup.roles[0]["Gambler:"];
        this.hasHost = this.setup.roles[0]["Host:"];
      }

      this.sendAlert(`The setup has been changed to ${this.setup.name}.`);
      // Set game in progress in redis db
      redis.setGameSetup(this.id, setupID);
      this.checkGameStart();
    } else {
      this.sendAlert(
        `Setup not found.`,
        this.players.filter((p) => p.user.id == this.hostId)
      );
    }
  }

  checkGameEnd() {
    var [finished, winners] = this.checkWinConditions();

    if (finished) this.endGame(winners);

    return finished;
  }

  checkWinConditions() {
    return [false];
  }

  getGameTypeOptions() {
    return {};
  }

  immediateEnd() {
    this.endNow = true;

    // Clear current timers
    this.clearTimers();

    // Finish all meetings and take actions
    this.finishMeetings();

    // Take snapshot of roles
    this.history.recordAllRoles();

    // Take snapshot of dead players
    this.history.recordAllDead();

    var winners = new Winners(this);
    winners.addGroup("No one");
    this.endGame(winners);
  }

  async endGame(winners) {
    try {
      if (this.finished) return;

      const winnersInfo = winners.getWinnersInfo();

      this.finished = true;
      this.clearTimers();

      this.winners = winners;
      this.currentState = -2;

      let stateInfo = this.getStateInfo();
      stateInfo.winners = winnersInfo;
      this.broadcastState(stateInfo);
      this.addStateToHistories(stateInfo.name);
      this.broadcast("winners", winnersInfo);
      redis.setGameState(this.id, stateInfo.name);
      redis.setWinnersInfo(this.id, winnersInfo);

      this.events.emit("aboutToFinish");

      this.history.recordAllRoles();
      this.history.recordAllDead();
      this.history.recordWinners();

      winners.queueAlerts();
      this.processObituaryQueue("Postgame");
      this.processDeathQueue();
      this.processExorciseQueue();
      this.processRevealQueue();
      this.processAlertQueue();

      for (let player of this.players) {
        this.broadcast("reveal", {
          playerId: player.id,
          role: `${player.role.name}:${player.role.modifier}`,
        });
        player.removeAllEffects();
        if (this.anonymousGame) {
          player.makeNotAnonymous();
        }
      }

      this.players.map((p) => p.send("players", this.getAllPlayerInfo(p)));

      if (this.achievementsAllowed()) {
        for (let player of this.players) {
          if (player.EarnedAchievements.length > 0) {
            for (let x = 0; x < player.EarnedAchievements.length; x++) {
              if (
                !player.user.achievements.includes(player.EarnedAchievements[x])
              ) {
                this.getAchievement(player.EarnedAchievements[x]);
                this.sendAlert(
                  `:star: ${
                    player.name
                  } has Earned the Achievement: ${this.getAchievement(
                    player.EarnedAchievements[x]
                  )}`,
                  undefined,
                  { color: "#d1cdab" }
                );
              }
            }
          }
        }
      }

      for (let player of this.players) {
        if (player.CompletedDailyChallenges.length > 0) {
          for (let x = 0; x < player.CompletedDailyChallenges.length; x++) {
            //this.getDailyChallenge(player.CompletedDailyChallenges[x]);
            this.sendAlert(
              `:star: ${
                player.name
              } has completed the Daily Challenge: ${this.getDailyChallenge(
                player.CompletedDailyChallenges[x][0],
                player.CompletedDailyChallenges[x][1]
              )}`,
              undefined,
              { color: "#d1cdab" }
            );
          }
        }
      }

      if (this.ranked || this.competitive) {
        await this.adjustSkillRatings();
      }

      if (this.isTest) {
        this.broadcast("finished");
        await redis.deleteGame(this.id);
        return;
      }

      // Start postgame meeting
      this.postgame = this.createMeeting(PostgameMeeting);

      for (let player of this.players)
        if (!player.left) this.postgame.join(player, this.postgame);

      this.postgame.init();

      for (let player of this.players)
        if (!player.left) player.sendMeeting(this.postgame);

      this.createTimer("postgame", this.postgameLength, () =>
        this.endPostgame()
      );
    } catch (e) {
      logger.error(e);
      // this.handleError(e);
    }
  }

  async penalizePlayerForLeaving(userId) {
    let leavePenalty = await models.LeavePenalty.findOne({
      userId: userId,
    }).select("level");

    const now = Date.now();

    // Determine the penalty level based on number of violations associated with record (if any) and amount of grace
    const penaltyLevel =
      (leavePenalty ? leavePenalty.level : 0) -
      constants.leavePenaltyForgivenessAmount;
    const isForgiven = penaltyLevel < 0;

    var penaltyMillis =
      constants.leavePenaltyMinimumMillis +
      penaltyLevel * constants.leavePenaltyPerLevelMillis;
    if (penaltyMillis > constants.leavePenaltyMaximumMillis) {
      penaltyMillis = constants.leavePenaltyMaximumMillis;
    }
    if (isForgiven) {
      penaltyMillis = 0;
    }

    const expiresOn = now + constants.leavePenaltyDurationMillis;
    const canPlayAfter = now + penaltyMillis;

    if (!leavePenalty) {
      // No penalty recorded - create a new record
      leavePenalty = new models.LeavePenalty({
        userId: userId,
        expiresOn: expiresOn,
        canPlayAfter: canPlayAfter,
        level: 0,
      });
      await leavePenalty.save();
    } else {
      // Penalty already recorded - update the existing one
      await models.LeavePenalty.updateOne(
        { userId: userId },
        {
          $inc: {
            level: 1,
          },
          $set: {
            expiresOn: expiresOn,
            canPlayAfter: canPlayAfter,
          },
        }
      ).exec();
    }
  }

  async adjustSkillRatings() {
    try {
      const setup = await models.Setup.findOne({ id: this.setup.id }).select(
        "id factionRatings"
      );
      const winners = this.winners.getPlayers();

      if (!setup) {
        logger.error("Failed to record stats because setup was null.");
        return;
      }

      // default the group ratings to an empty array if not yet exists
      const factionRatingsRaw = setup.factionRatings || [];
      const factionRatings = new Map(
        factionRatingsRaw.map((factionRating) => [
          factionRating.factionName,
          factionRating.skillRating,
        ])
      );

      const factionWinnerFractions = {};
      const memberFactions = {};
      for (let playerId in this.originalRoles) {
        const roleName = this.originalRoles[playerId].split(":")[0];
        const alignment = this.getRoleAlignment(roleName);

        // Use the alignment name for factions, otherwise use role name for independents
        const alignmentIsFaction =
          alignment === "Village" ||
          alignment === "Mafia" ||
          alignment === "Cult";
        const factionName = alignmentIsFaction ? alignment : roleName;
        memberFactions[playerId] = factionName;

        if (factionWinnerFractions[factionName] === undefined) {
          factionWinnerFractions[factionName] = {
            originalCount: 0,
            winnerCount: 0,
          };
        }

        factionWinnerFractions[factionName].originalCount++;
        if (winners.includes(playerId)) {
          factionWinnerFractions[factionName].winnerCount++;
        }
      }

      const factionNames = Object.keys(factionWinnerFractions);

      // Default initialize the faction rating for the setup if it doesn't yet exist
      const factionsToBeRated = factionNames.map((factionName) => {
        if (factionRatings.has(factionName)) {
          const factionRating = factionRatings.get(factionName);
          return [rating({ mu: factionRating.mu, sigma: factionRating.sigma })];
        } else {
          return [
            rating({
              mu: constants.defaultSkillRatingMu,
              sigma: constants.defaultSkillRatingSigma,
            }),
          ];
        }
      });

      // In most cases the faction winner fraction will be either 0 or 1
      // In edge cases, such as members of a faction being converted then losing to their starting faction, this number will be somewhere in between
      const factionScores = factionNames.map((factionName) => {
        const factionWinnerFraction = factionWinnerFractions[factionName];
        return (
          factionWinnerFraction.winnerCount /
          factionWinnerFraction.originalCount
        );
      });

      // library code time
      const predictions = predictWin(factionsToBeRated);
      const ratedFactions = rate(factionsToBeRated, { score: factionScores });

      /* Notes:
       * - Read the library documentation before tweaking anything: https://www.npmjs.com/package/openskill
       * - A player's "mean" rating is their mu, and their "standard deviation" rating is their sigma
       * - Elo is a combination of mu and sigma: elo = mu - 3 * sigma
       * - Because a player's sigma starts off unnecessarily high, a loss can artificially allow a player to gain elo
       * - This implementation is not actually elo but everyone knows what that word is so we're calling it that
       * - In the event that everyone wins, no one's mu rating will change and points will be evenly distributed
       * - In the event that no one wins, no one's mu rating will change and no points will be distributed
       * - A player's points won (if they win) is decided by their starting faction
       *   - This could be exploited with a heavily cult sided setup where cult converts many towns, not sure how to address this
       */

      // Transform the results from the rate and predictWin functions back into their usable forms
      const pointsWonByFactions = {};
      const pointsLostByFactions = {};
      const newFactionSkillRatings = factionRatingsRaw.filter(
        (factionRating) => !factionNames.includes(factionRating.factionName)
      );
      for (var i = 0; i < factionNames.length; i++) {
        const factionName = factionNames[i];
        const winPredictionPercent = predictions[i]; // this adds up to 1 across all factions
        const newSkillRating = ratedFactions[i];

        pointsWonByFactions[factionName] = Math.round(
          constants.pointsNominalAmount / 2 / winPredictionPercent
        );
        pointsLostByFactions[factionName] = Math.round(
          constants.pointsNominalAmount / 2 / (1 - winPredictionPercent)
        );

        newFactionSkillRatings.push({
          factionName: factionName,
          skillRating: newSkillRating[0],
          elo: ordinal(newSkillRating[0]),
        });
      }

      // If a player wins, they earn the amount of points allocated to the faction that they started with
      const maxEarnedPoints = constants.pointsNominalAmount * 20;
      for (let playerId in this.originalRoles) {
        const player = this.getPlayer(playerId);
        const playerWon = winners.includes(playerId);

        var pointsEarnedByPlayer = playerWon
          ? pointsWonByFactions[memberFactions[playerId]]
          : pointsLostByFactions[memberFactions[playerId]];
        if (pointsEarnedByPlayer > maxEarnedPoints) {
          pointsEarnedByPlayer = maxEarnedPoints;

          if (playerWon) {
            // Rare occurrence - notify everyone of the player's winnings
            this.sendAlert(
              `${player.name} just earned ${pointsEarnedByPlayer} fortune!!`,
              undefined,
              undefined,
              ["info"]
            );
          }
        } else {
          if (playerWon) {
            // Notify the player of their winnings
            player.sendAlert(
              `You have earned ${pointsEarnedByPlayer} fortune!`,
              undefined,
              undefined,
              ["info"]
            );
          }
        }

        if (playerWon) {
          this.pointsEarnedByPlayers[playerId] = pointsEarnedByPlayer;
        } else {
          this.pointsEarnedByPlayers[playerId] = -pointsEarnedByPlayer;
        }
      }

      await models.Setup.updateOne(
        { id: setup.id },
        {
          $set: {
            factionRatings: newFactionSkillRatings,
          },
        }
      );
    } catch (e) {
      logger.error("Error adjusting skill ratings: ", e);
      return {};
    }
  }

  async recordSetupStats(setup) {
    try {
      if (!setup) {
        logger.error("Failed to record stats because setup was null.");
        return;
      }

      var setupVersionNum = setup.version || 0;

      let setupVersion = await models.SetupVersion.findOne({
        setup: new ObjectID(setup._id),
        version: setupVersionNum,
      }).select("_id");

      if (!setupVersion) {
        // If version doesn't yet exist, create one
        logger.info("Migrating setup statistics to setup version object");

        // Try to inherit these deprecated fields from the setup
        var legacyRolePlays = setup.rolePlays;
        var legacyRoleWins = setup.roleWins;
        var legacyPlayed = setup.played;

        setupVersion = new models.SetupVersion({
          version: setupVersionNum,
          setup: new ObjectID(setup._id),
          changelog: "",
          rolePlays: legacyRolePlays || {},
          roleWins: legacyRoleWins || {},
          played: legacyPlayed || 0,
        });
        await setupVersion.save();
      }

      var rolePlays = {};
      var alignmentPlays = {};
      var roleWins = {};
      var alignmentWins = {};

      for (let playerId in this.originalRoles) {
        let roleName = this.originalRoles[playerId].split(":")[0];
        let alignment = this.getRoleAlignment(roleName);

        if (rolePlays[roleName] == null) rolePlays[roleName] = 0;
        if (alignmentPlays[alignment] == null) alignmentPlays[alignment] = 0;

        rolePlays[roleName]++;
        alignmentPlays[alignment]++;
      }

      for (let playerId of this.winners.getPlayers()) {
        // Skip players who don't have an original role
        if (!this.originalRoles[playerId]) {
          continue;
        }

        let roleName = this.originalRoles[playerId].split(":")[0];
        let alignment = this.getRoleAlignment(roleName);

        if (roleWins[roleName] == null) roleWins[roleName] = 0;
        if (alignmentWins[alignment] == null) alignmentWins[alignment] = 0;

        roleWins[roleName]++;
        alignmentWins[alignment]++;
      }

      // Using a dot to separate the field name and role name allows mongoDB to update the role's sub-field
      var increments = {};
      Object.keys(rolePlays).forEach(function (key) {
        increments[`rolePlays.${key}`] = rolePlays[key];
      });
      Object.keys(roleWins).forEach(function (key) {
        increments[`roleWins.${key}`] = roleWins[key];
      });
      Object.keys(alignmentPlays).forEach(function (key) {
        increments[`alignmentPlays.${key}`] = alignmentPlays[key];
      });
      Object.keys(alignmentWins).forEach(function (key) {
        increments[`alignmentWins.${key}`] = alignmentWins[key];
      });

      if ("dayCount" in this) {
        increments[`dayCountWins.${this.dayCount}`] = 1;
      }

      await models.SetupVersion.updateOne(
        { _id: new ObjectID(setupVersion._id) },
        {
          $inc: {
            ...increments,
            played: 1,
          },
        }
      ).exec();
    } catch (e) {
      logger.error("Error recording setup statistics: ", e);
    }
  }

  async endPostgame() {
    try {
      if (this.postgameOver) return;

      var kudosTarget = null;
      if (this.isKudosEligible()) {
        this.postgame.finish(true);
        if (this.postgame.finalTarget && this.postgame.finalTarget !== "*") {
          kudosTarget = this.postgame.finalTarget;
          this.sendAlert(
            `${kudosTarget.name} has received kudos!`,
            undefined,
            undefined,
            ["info"]
          );
        }
      }

      this.postgameOver = true;
      this.clearTimers();
      this.broadcast("finished");
      await redis.deleteGame(this.id);

      for (let player of this.players)
        if (!player.left) player.user.disconnect();

      var setup = await models.Setup.findOne({ id: this.setup.id }).select(
        "id version rolePlays roleWins played factionRatings"
      );

      this.recordSetupStats(setup);

      var history = this.history.getHistoryInfo(null, true);
      var users = [];
      var playersGone = Object.values(this.playersGone);
      var allPlayers = this.players.concat(playersGone);

      // Filter to only include players who were assigned roles (i.e., were in the game when it started)
      var players = allPlayers.filter((p) => this.originalRoles[p.id]);

      let playerIdMap = {};
      let playerAlignmentMap = {};
      for (let player of players) {
        const roleName = this.originalRoles[player.id].split(":")[0];
        const alignment = this.getRoleAlignment(roleName);

        let userId = player.userId || player.user.id;
        let user = await models.User.findOne({ id: userId }).select("_id");
        playerIdMap[userId] = player.id;
        playerAlignmentMap[userId] = alignment;

        if (user) users.push(user._id);
      }

      var playerNames = players.map((p) => p.name);
      var playerIds = players.map((p) => p.id);

      // Only include players who left and had roles assigned
      var playersLeft = playersGone.filter((p) => this.originalRoles[p.id]);

      var game = new models.Game({
        id: this.id,
        type: this.type,
        lobby: this.lobby,
        lobbyName: this.lobbyName,
        setup: setup._id,
        users: users,
        players: playerIds,
        left: playersLeft.map((p) => p.id),
        names: playerNames,
        winners: this.winners.players.map((p) => p.id),
        winnersInfo: this.winners.getWinnersInfo(),
        playerIdMap: JSON.stringify(playerIdMap),
        playerAlignmentMap: JSON.stringify(playerAlignmentMap),
        history: JSON.stringify(history),
        startTime: this.startTime,
        endTime: Date.now(),
        ranked: this.ranked,
        competitive: this.competitive,
        private: this.private,
        guests: this.guests,
        spectating: this.spectating,
        readyCheck: this.readyCheck,
        noVeg: this.noVeg,
        kudosReceiver: kudosTarget ? kudosTarget.user.id : "",
        stateLengths: this.stateLengths,
        gameTypeOptions: JSON.stringify(this.getGameTypeOptions()),
        anonymousGame: this.anonymousGame,
        anonymousDeck: this.anonymousDeck,
      });
      await game.save();

      // Determine the heart type of this game based on if it was comp, ranked, or neither
      const heartType = this.competitive ? "gold" : this.ranked ? "red" : null;

      for (let player of this.players) {
        let coinsEarned = 0;
        if (this.ranked && player.won) {
          coinsEarned++;
        }

        let pointsWon = 0;
        if (this.pointsEarnedByPlayers[player.id] !== undefined) {
          pointsWon = this.pointsEarnedByPlayers[player.id];
        }

        if (this.achievementsAllowed()) {
          if (player.EarnedAchievements.length > 0) {
            for (let x = 0; x < player.EarnedAchievements.length; x++) {
              if (
                !player.user.achievements.includes(player.EarnedAchievements[x])
              ) {
                player.user.achievements.push(player.EarnedAchievements[x]);
                coinsEarned += this.getAchievementReward(
                  player.EarnedAchievements[x]
                );
              }
            }
          }
        } else {
          player.EarnedAchievements = [];
        }

        if (
          this.hasIntegrity &&
          !this.private &&
          player.DailyTracker &&
          player.DailyTracker.length >= 1
        ) {
          coinsEarned += player.DailyPayout;
          if (
            player.user.dailyChallenges &&
            player.user.dailyChallenges.length <= 0
          ) {
            coinsEarned += 20;
            player.DailyCompleted = 1;
          } else {
            player.DailyCompleted = 0;
          }
        }

        await models.User.updateOne(
          { id: player.user.id },
          {
            $push: { games: game._id },
            $addToSet: { achievements: { $each: player.EarnedAchievements } },
            $set: {
              stats: player.user.stats,
              playedGame: true,
              achievementCount: player.user.achievements.length,
              winRate:
                (player.user.stats["Mafia"].all.wins.count || 0) /
                (player.user.stats["Mafia"].all.wins.total || 1),
            },
            $inc: {
              coins: coinsEarned,
              redHearts: this.ranked ? -1 : 0,
              goldHearts: this.competitive ? -1 : 0,
              kudos:
                kudosTarget && kudosTarget.user.id == player.user.id ? 1 : 0,
              points: pointsWon > 0 ? pointsWon : 0,
              pointsNegative: pointsWon < 0 ? -pointsWon : 0,
            },
          }
        ).exec();

        if (player.DailyTracker && player.DailyTracker.length >= 1) {
          await models.User.updateOne(
            { id: player.user.id },
            {
              $set: {
                dailyChallenges: player.user.dailyChallenges.map(
                  (day) => `${day[0]}:${day[1]}:${day[2]}`
                ),
              },
              $inc: {
                dailyChallengesCompleted: player.DailyCompleted,
              },
            }
          ).exec();
        }

        if (heartType && !player.isBot) {
          let heartRefresh = await models.HeartRefresh.findOne({
            userId: player.user.id,
            type: heartType,
          }).select("_id");
          if (!heartRefresh) {
            heartRefresh = new models.HeartRefresh({
              userId: player.user.id,
              when: Date.now() + constants.redHeartRefreshIntervalMillis,
              type: heartType,
            });
            await heartRefresh.save();
          }
        }

        let dailyRefresh = await models.DailyChallengeRefresh.findOne().select(
          "_id"
        );
        if (!dailyRefresh) {
          dailyRefresh = new models.DailyChallengeRefresh({
            when: Date.now() + constants.dailyChallengesRefreshIntervalMillis,
          });
          await dailyRefresh.save();
        }

        if (!player.isBot) {
          await redis.cacheUserInfo(player.user.id, true);
        }

        // if (this.ranked && player.user.referrer && player.user.rankedCount == constants.referralGames - 1) {
        //     await models.User.updateOne(
        //         { id: player.user.referrer },
        //         { $inc: { coins: constants.referralCoins } }
        //     );
        // }
      }

      delete games[this.id];
      deprecationCheck();
    } catch (e) {
      logger.error(e);
      // this.handleError(e);
    }
  }

  async queueScheduleNotifications() {
    var usersWhoReserved = await redis.getGameReservations(this.id);

    this.timeouts.push(
      setTimeout(() => {
        routeUtils.createNotification(
          {
            content: `Game ${this.id} is starting! Click to join.`,
            icon: "gamepad",
            link: `/game/${this.id}`,
          },
          usersWhoReserved
        );
      }, this.scheduled - Date.now())
    );

    var oneHourBefore = this.scheduled - Date.now() - 1000 * 60 * 60;

    if (oneHourBefore < 1000) return;

    this.timeouts.push(
      setTimeout(() => {
        routeUtils.createNotification(
          {
            content: `Game ${this.id} is scheduled to start in one hour.`,
            icon: "gamepad",
          },
          usersWhoReserved
        );
      }, this.scheduled - Date.now())
    );
  }
};
