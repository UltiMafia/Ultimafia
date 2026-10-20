const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const db = require("../../db/db");
const redis = require("../../modules/redis");
const Game = require("../../Games/core/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;
const models = require("../../db/models");
const { parseTextEffect } = require("../../shared/textEffects");

let seq = 0;

function nextId(prefix) {
  seq += 1;
  return `${prefix}sc${seq}`;
}

function makeUser(id, name) {
  return new User({
    id: id || nextId("u"),
    socket: new Socket(),
    name: name || id || "user",
    settings: {},
  });
}

function events(socket, name) {
  return socket.clientMessages.filter((message) => message.eventName === name);
}

function chatTexts(socket) {
  return events(socket, "message").map((message) => message.data.content);
}

function say(person, content, meetingId) {
  person.socket.sendToServer("speak", {
    content,
    meetingId: String(meetingId || ""),
    abilityName: "",
    abilityTarget: "",
  });
}

// The command handlers run asynchronously (permission and seat checks).
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

async function makeGame(extra) {
  extra = extra || {};
  const game = new Game({
    id: extra.id || nextId("g"),
    hostId: extra.hostId || nextId("h"),
    settings: {
      setup: { id: "setup", total: extra.total || 3 },
      private: true,
      ranked: false,
      competitive: false,
      spectating: extra.spectating !== false,
      readyCheck: extra.readyCheck !== false,
      stateLengths: { Day: 1000, Night: 1000 },
    },
    isTest: true,
  });
  await game.init();
  // isTest would start immediately when the seats fill, skipping the ready check.
  game.checkGameStart = () => {};
  return game;
}

// Starts the game without roles or states so spectator chat can be checked.
async function startBare(game) {
  game.assignRoles = () => {};
  game.captureStartingFactions = () => {};
  game.gotoNextState = () => {};
  await game.start();
  game.makeMeetings();
}

function playerFor(game, user) {
  return game.players.array().filter((p) => p.user.id === user.id)[0];
}

describe("Games/SpectateCommands", function () {
  this.timeout(20000);

  before(async function () {
    await db.promise;
  });

  afterEach(async function () {
    if (this.currentGame) {
      this.currentGame.clearTimers();
      await this.currentGame.cancel();
      this.currentGame = null;
    }
  });

  async function openGame(extra) {
    await redis.client.flushdbAsync();
    const game = await makeGame(extra);
    this.currentGame = game;
    return game;
  }

  describe("parsing", function () {
    it("/join and /spectate are commands, not text effects", function () {
      expect(parseTextEffect("/join")).to.equal(null);
      expect(parseTextEffect("/spectate")).to.equal(null);
      expect(parseTextEffect("/wave hi")).to.deep.equal({
        effect: "wave",
        text: "hi",
      });
    });

    it("/help lists /join and /spectate", function () {
      const commands = require("../../data/commands");
      should.exist(commands["/join"]);
      should.exist(commands["/spectate"]);
    });
  });

  describe("/join", function () {
    it("seats a pregame spectator through the take-seat path", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      game.spectators.should.have.lengthOf(1);

      watcher.socket.flushMessages();
      say(game.spectators[0], "/join", game.pregame.id);
      await settle();

      game.spectators.should.have.lengthOf(0);
      game.players.should.have.lengthOf(2);
      should.exist(playerFor(game, watcher));
      (await redis.inGame(watcher.id)).should.equal(game.id);
      events(watcher.socket, "isSpectator").map((e) => e.data).should.include(false);
      events(watcher.socket, "takeSeatFailed").should.have.lengthOf(0);
      // The command itself is never sent as chat.
      chatTexts(host.socket).should.not.include("/join");
    });

    it("explains in chat when no seat is open", async function () {
      const game = await openGame.call(this, { total: 1 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });

      watcher.socket.flushMessages();
      host.socket.flushMessages();
      say(game.spectators[0], "/join", game.pregame.id);
      await settle();

      game.spectators.should.have.lengthOf(1);
      game.players.should.have.lengthOf(1);
      chatTexts(watcher.socket).should.include(":system: No open seats.");
      events(watcher.socket, "takeSeatFailed").should.have.lengthOf(0);
      // Only the spectator who asked sees the refusal.
      chatTexts(host.socket).should.not.include(":system: No open seats.");
    });

    it("keeps the take-seat gates (a banned spectator stays spectating)", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      game.banned[watcher.id] = true;

      watcher.socket.flushMessages();
      say(game.spectators[0], "/join", game.pregame.id);
      await settle();

      game.spectators.should.have.lengthOf(1);
      chatTexts(watcher.socket).should.include(
        ":system: You are banned from this game."
      );
    });

    it("tells a seated player they are already playing", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      await game.userJoin(host);

      host.socket.flushMessages();
      say(playerFor(game, host), "/join", game.pregame.id);
      await settle();

      game.players.should.have.lengthOf(1);
      chatTexts(host.socket).should.include(
        ":system: You are already playing in this game."
      );
    });

    it("refuses once the game has started", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      await startBare(game);

      watcher.socket.flushMessages();
      say(game.spectators[0], "/join", game.spectatorMeeting.id);
      await settle();

      game.players.should.have.lengthOf(1);
      game.spectators.should.have.lengthOf(1);
      chatTexts(watcher.socket).should.include(
        ":system: You can only take a seat during pregame."
      );
    });
  });

  describe("/spectate", function () {
    it("moves a pregame player to spectators and frees the seat", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      await game.userJoin(host);
      await game.userJoin(other);

      host.socket.flushMessages();
      say(playerFor(game, other), "/spectate", game.pregame.id);
      await settle();

      game.players.should.have.lengthOf(1);
      game.spectators.should.have.lengthOf(1);
      game.spectators[0].user.id.should.equal(other.id);
      expect(await redis.inGame(other.id)).to.equal(false);
      should.exist(game.pregame.members[game.spectators[0].id]);
      chatTexts(host.socket).should.include("other is now spectating.");
      game.hostId.should.equal(host.id);
    });

    it("hands host to the next player when the host spectates", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      await game.userJoin(host);
      await game.userJoin(other);

      say(playerFor(game, host), "/spectate", game.pregame.id);
      await settle();

      game.spectators.should.have.lengthOf(1);
      game.spectators[0].user.id.should.equal(host.id);
      game.hostId.should.equal(other.id);
    });

    it("can /spectate and /join again on the same connection", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      await game.userJoin(host);
      await game.userJoin(other);

      say(playerFor(game, other), "/spectate", game.pregame.id);
      await settle();
      game.spectators.should.have.lengthOf(1);

      say(game.spectators[0], "/join", game.pregame.id);
      await settle();
      game.spectators.should.have.lengthOf(0);
      game.players.should.have.lengthOf(2);
      (await redis.inGame(other.id)).should.equal(game.id);
    });

    it("cancels a running ready check", async function () {
      const game = await openGame.call(this, { total: 2 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      await game.userJoin(host);
      await game.userJoin(other);
      game.startReadyCheck();
      game.isReadyCheckActive.should.equal(true);

      host.socket.flushMessages();
      say(playerFor(game, other), "/spectate", game.pregame.id);
      await settle();

      game.isReadyCheckActive.should.equal(false);
      should.not.exist(game.timers["pregameCountdown"]);
      events(host.socket, "readyCheck cancel").should.have.lengthOf(1);
      events(other.socket, "readyCheck cancel").should.have.lengthOf(0);
    });

    it("refuses the only seated player and keeps the seat", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });

      host.socket.flushMessages();
      watcher.socket.flushMessages();
      say(playerFor(game, host), "/spectate", game.pregame.id);
      await settle();

      game.players.should.have.lengthOf(1);
      game.spectators.should.have.lengthOf(1);
      game.hostId.should.equal(host.id);
      (await redis.inGame(host.id)).should.equal(game.id);
      chatTexts(host.socket).should.include(
        ":system: You are the only player in this game, so you cannot move to spectators. Leave the game instead, or wait for another player to join."
      );
      // Only the player who asked sees the refusal.
      chatTexts(watcher.socket).some((t) => t.includes("only player")).should.equal(false);
    });

    it("refuses when spectating is off and keeps the seat", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      await game.userJoin(host);
      await game.userJoin(other);

      host.socket.flushMessages();
      say(playerFor(game, host), "/spectate", game.pregame.id);
      await settle();

      game.players.should.have.lengthOf(2);
      game.spectators.should.have.lengthOf(0);
      chatTexts(host.socket).should.include(
        ":system: Spectating is not enabled for this game."
      );
    });

    it("refuses once the game has started", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      await game.userJoin(host);
      await game.userJoin(other);
      await startBare(game);

      host.socket.flushMessages();
      say(playerFor(game, host), "/spectate", game.pregame.id);
      await settle();

      game.players.should.have.lengthOf(2);
      game.spectators.should.have.lengthOf(0);
      chatTexts(host.socket).should.include(
        ":system: You can only move to spectators during pregame."
      );
    });

    it("tells a spectator they are already spectating", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });

      watcher.socket.flushMessages();
      say(game.spectators[0], "/spectate", game.pregame.id);
      await settle();

      game.spectators.should.have.lengthOf(1);
      chatTexts(watcher.socket).should.include(
        ":system: You are already spectating this game."
      );
    });
  });

  describe("join hint", function () {
    const HINT =
      ":system: You are spectating. Type /join to take a seat at the table.";
    const hints = (socket) => chatTexts(socket).filter((t) => t === HINT);

    it("tells a user who joins the lobby as a spectator, once", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      host.socket.flushMessages();
      await game.userJoin(watcher, { spectate: true });
      await settle();

      hints(watcher.socket).should.have.lengthOf(1);
      hints(host.socket).should.have.lengthOf(0);
    });

    it("tells a spectator who lands in a full lobby", async function () {
      const game = await openGame.call(this, { total: 1 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher);
      await settle();

      game.spectators.should.have.lengthOf(1);
      hints(watcher.socket).should.have.lengthOf(1);
      hints(host.socket).should.have.lengthOf(0);
    });

    it("tells a player moved to spectators by a missed ready check", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      const late = makeUser(null, "late");
      await game.userJoin(host);
      await game.userJoin(other);
      await game.userJoin(late);
      game.startReadyCheck();
      game.readyPlayers[playerFor(game, host).id] = true;
      game.readyPlayers[playerFor(game, other).id] = true;

      for (const u of [host, other, late]) u.socket.flushMessages();
      await game.failReadyCheck();
      await settle();

      game.spectators.should.have.lengthOf(1);
      game.spectators[0].user.id.should.equal(late.id);
      hints(late.socket).should.have.lengthOf(1);
      hints(host.socket).should.have.lengthOf(0);
      hints(other.socket).should.have.lengthOf(0);
    });

    it("tells a player who types /spectate", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      await game.userJoin(host);
      await game.userJoin(other);

      host.socket.flushMessages();
      other.socket.flushMessages();
      say(playerFor(game, other), "/spectate", game.pregame.id);
      await settle();

      game.spectators.should.have.lengthOf(1);
      hints(other.socket).should.have.lengthOf(1);
      hints(host.socket).should.have.lengthOf(0);
    });

    it("is not sent once the game has started", async function () {
      const game = await openGame.call(this, { total: 2 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      const early = makeUser(null, "early");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(other);
      await game.userJoin(early, { spectate: true });
      await settle();
      hints(early.socket).should.have.lengthOf(1);

      early.socket.flushMessages();
      await startBare(game);

      await game.userJoin(watcher, { spectate: true });
      await settle();

      game.spectators.should.have.lengthOf(2);
      hints(watcher.socket).should.have.lengthOf(0);
      hints(early.socket).should.have.lengthOf(0);
    });

    it("is not sent when a gate would refuse the seat (banned)", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      game.banned[watcher.id] = true;
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      await settle();

      game.spectators.should.have.lengthOf(1);
      hints(watcher.socket).should.have.lengthOf(0);
    });

    it("is not sent again on reconnect or to players later", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      await settle();
      hints(watcher.socket).should.have.lengthOf(1);

      // A refresh reconnects the same spectator on a new socket.
      const again = makeUser(watcher.id, "watcher");
      await game.userJoin(again);
      await settle();
      game.spectators.should.have.lengthOf(1);
      hints(again.socket).should.have.lengthOf(0);

      // Players reconnecting never get it.
      const hostAgain = makeUser(host.id, "host");
      await game.userJoin(hostAgain);
      await settle();
      hints(hostAgain.socket).should.have.lengthOf(0);
    });

    // A browser refresh: the old socket closes, then a new one connects.
    async function refresh(game, user, joinOptions) {
      user.socket.sendToServer("disconnected");
      const again = makeUser(user.id, user.name);
      await game.userJoin(again, joinOptions);
      await settle();
      return again;
    }

    const entriesFor = (game, userId) =>
      Object.values(game.getAllSpectatorInfo()).filter(
        (s) => s.userId === userId
      );

    for (const label of ["with ?spectate=true", "without ?spectate=true"]) {
      it(`a refresh ${label} keeps one entry and sends no second hint`, async function () {
        const game = await openGame.call(this, { total: 3 });
        const host = makeUser(game.hostId, "host");
        const watcher = makeUser(null, "watcher");
        await game.userJoin(host);
        await game.userJoin(watcher, { spectate: true });
        await settle();
        hints(watcher.socket).should.have.lengthOf(1);
        const firstId = game.spectators[0].id;

        host.socket.flushMessages();
        const opts = label.startsWith("with ") ? { spectate: true } : undefined;
        let current = watcher;
        for (let i = 0; i < 3; i++) {
          current = await refresh(game, current, opts);
          hints(current.socket).should.have.lengthOf(0);
        }

        game.spectators.should.have.lengthOf(1);
        game.spectators[0].id.should.equal(firstId);
        game.players.should.have.lengthOf(1);
        entriesFor(game, watcher.id).should.have.lengthOf(1);
        // Players see no leave/join churn for the refresh.
        events(host.socket, "spectatorCount").should.have.lengthOf(0);
        events(host.socket, "spectators").should.have.lengthOf(0);
      });
    }

    it("a reconnect after the grace time reuses the entry and sends no hint", async function () {
      const game = await openGame.call(this, { total: 3 });
      game.spectatorReconnectGraceMs = 20;
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      await settle();
      const firstId = game.spectators[0].id;

      watcher.socket.sendToServer("disconnected");
      await settle();
      game.spectators.should.have.lengthOf(0);

      // No ?spectate=true: the remembered user id keeps them spectating.
      const again = makeUser(watcher.id, "watcher");
      await game.userJoin(again);
      await settle();

      game.spectators.should.have.lengthOf(1);
      game.players.should.have.lengthOf(1);
      game.spectators[0].id.should.equal(firstId);
      entriesFor(game, watcher.id).should.have.lengthOf(1);
      hints(again.socket).should.have.lengthOf(0);
    });

    it("tells them again after a seat and /spectate, with one entry", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      await settle();

      say(game.spectators[0], "/join", game.pregame.id);
      await settle();
      game.spectators.should.have.lengthOf(0);

      watcher.socket.flushMessages();
      say(playerFor(game, watcher), "/spectate", game.pregame.id);
      await settle();

      game.spectators.should.have.lengthOf(1);
      hints(watcher.socket).should.have.lengthOf(1);
      entriesFor(game, watcher.id).filter((s) => s.watching).should.have.lengthOf(1);
    });
  });

  describe("missed ready check with spectating off", function () {
    const HINT =
      ":system: You are spectating. Type /join to take a seat at the table.";
    const hints = (socket) => chatTexts(socket).filter((t) => t === HINT);

    async function failLate(game, total) {
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      const late = makeUser(null, "late");
      await game.userJoin(host);
      await game.userJoin(other);
      await game.userJoin(late);
      game.players.should.have.lengthOf(total);
      game.startReadyCheck();
      game.readyPlayers[playerFor(game, host).id] = true;
      game.readyPlayers[playerFor(game, other).id] = true;

      for (const u of [host, other, late]) u.socket.flushMessages();
      await game.failReadyCheck();
      await settle();
      return { host, other, late };
    }

    it("removes the player without a penalty and they can rejoin the seat", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const { host, late } = await failLate(game, 3);

      game.players.should.have.lengthOf(2);
      game.spectators.should.have.lengthOf(0);
      game.pregameSpectatorUserIds.has(late.id).should.equal(false);
      events(late.socket, "error").should.have.lengthOf(1);
      events(late.socket, "left").should.have.lengthOf(1);
      events(late.socket, "readyCheck failed").should.have.lengthOf(0);
      hints(late.socket).should.have.lengthOf(0);
      chatTexts(host.socket).should.include(
        "late was removed from the game for not readying."
      );
      should.not.exist(await models.LeavePenalty.findOne({ userId: late.id }));
      expect(await redis.inGame(late.id)).to.not.equal(game.id);

      // Back through the lobby link: a seat, not a "spectating is off" error.
      const again = makeUser(late.id, "late");
      await game.userJoin(again);
      await settle();

      events(again.socket, "error").should.have.lengthOf(0);
      game.players.should.have.lengthOf(3);
      game.spectators.should.have.lengthOf(0);
      should.exist(playerFor(game, again));
      (await redis.inGame(late.id)).should.equal(game.id);
    });

    it("seats a user left counted as a spectator in a no-spectate game", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      game.spectatorReconnectGraceMs = 0;
      const host = makeUser(game.hostId, "host");
      const stuck = makeUser(null, "stuck");
      await game.userJoin(host);
      // What an older ready check left behind.
      game.addSpectator(stuck);
      await settle();
      hints(stuck.socket).should.have.lengthOf(0);

      stuck.socket.sendToServer("disconnected");
      await settle();
      game.spectators.should.have.lengthOf(0);
      game.pregameSpectatorUserIds.has(stuck.id).should.equal(true);

      const again = makeUser(stuck.id, "stuck");
      await game.userJoin(again);
      await settle();

      events(again.socket, "error").should.have.lengthOf(0);
      game.players.should.have.lengthOf(2);
      should.exist(playerFor(game, again));
      game.spectators.should.have.lengthOf(0);
      game.pregameSpectatorUserIds.has(stuck.id).should.equal(false);
    });

    it("seats a stuck spectator who reconnects inside the grace time", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const host = makeUser(game.hostId, "host");
      const stuck = makeUser(null, "stuck");
      await game.userJoin(host);
      game.addSpectator(stuck);

      stuck.socket.sendToServer("disconnected");
      const again = makeUser(stuck.id, "stuck");
      await game.userJoin(again);
      await settle();

      events(again.socket, "error").should.have.lengthOf(0);
      game.players.should.have.lengthOf(2);
      should.exist(playerFor(game, again));
      game.spectators.should.have.lengthOf(0);
    });

    it("still refuses ?spectate=true when spectating is off", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      await settle();

      events(watcher.socket, "error").map((e) => e.data).should.deep.equal([
        "Spectating is not enabled for this game",
      ]);
      game.players.should.have.lengthOf(1);
      game.spectators.should.have.lengthOf(0);
    });

    it("spectating on: the player still moves to spectators and stays there", async function () {
      const game = await openGame.call(this, { total: 3 });
      game.spectatorReconnectGraceMs = 0;
      const { late } = await failLate(game, 3);

      game.players.should.have.lengthOf(2);
      game.spectators.should.have.lengthOf(1);
      game.spectators[0].user.id.should.equal(late.id);
      events(late.socket, "error").should.have.lengthOf(0);
      events(late.socket, "left").should.have.lengthOf(0);
      events(late.socket, "readyCheck failed").should.have.lengthOf(1);
      hints(late.socket).should.have.lengthOf(1);

      late.socket.sendToServer("disconnected");
      await settle();
      const again = makeUser(late.id, "late");
      await game.userJoin(again);
      await settle();

      game.players.should.have.lengthOf(2);
      game.spectators.should.have.lengthOf(1);
      game.spectators[0].user.id.should.equal(late.id);
    });
  });

  describe("spectators list", function () {
    it("marks only current spectators as watching", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const a = makeUser(null, "a");
      const b = makeUser(null, "b");
      await game.userJoin(host);
      await game.userJoin(a, { spectate: true });
      await game.userJoin(b, { spectate: true });

      const watchingNames = () =>
        Object.values(game.getAllSpectatorInfo())
          .filter((s) => s.watching)
          .map((s) => s.name)
          .sort();

      watchingNames().should.deep.equal(["a", "b"]);

      say(game.spectators[0], "/join", game.pregame.id);
      await settle();
      watchingNames().should.deep.equal(["b"]);
      // The seated player's old entry is kept for chat names, not listed.
      Object.values(game.getAllSpectatorInfo())
        .map((s) => s.name)
        .should.include("a");
    });
  });

  describe("spectator chat visibility", function () {
    it("players in the game never receive spectator chat", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      const watcher = makeUser(null, "watcher");
      const watcher2 = makeUser(null, "watcher2");
      await game.userJoin(host);
      await game.userJoin(other);
      await game.userJoin(watcher, { spectate: true });
      await game.userJoin(watcher2, { spectate: true });

      host.socket.flushMessages();
      other.socket.flushMessages();
      await startBare(game);

      // Players are never sent the spectator meeting.
      const meetingNames = (socket) =>
        events(socket, "meeting").map((e) => e.data.name);
      meetingNames(host.socket).should.not.include("Spectator Meeting");
      meetingNames(other.socket).should.not.include("Spectator Meeting");
      meetingNames(watcher.socket).should.include("Spectator Meeting");

      host.socket.flushMessages();
      other.socket.flushMessages();
      watcher.socket.flushMessages();
      watcher2.socket.flushMessages();

      const spectator = game.spectators.filter(
        (s) => s.user.id === watcher.id
      )[0];
      say(spectator, "spec only", game.spectatorMeeting.id);

      chatTexts(watcher.socket).should.deep.equal(["spec only"]);
      chatTexts(watcher2.socket).should.deep.equal(["spec only"]);
      chatTexts(host.socket).should.not.include("spec only");
      chatTexts(other.socket).should.not.include("spec only");

      // A player cannot post into spectator chat either.
      say(playerFor(game, host), "player in spec chat", game.spectatorMeeting.id);
      chatTexts(watcher.socket).should.not.include("player in spec chat");
      game.spectatorMeeting.messages
        .map((m) => m.content)
        .should.not.include("player in spec chat");
    });

    it("a player who is out of the game reads and writes spectator chat", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(other);
      await game.userJoin(watcher, { spectate: true });
      await startBare(game);

      game.exorcisePlayer(playerFor(game, other));
      const outSpectator = game.spectators.filter(
        (s) => s.user.id === other.id
      )[0];
      should.exist(game.spectatorMeeting.members[outSpectator.id]);

      host.socket.flushMessages();
      other.socket.flushMessages();
      watcher.socket.flushMessages();

      const spectator = game.spectators.filter(
        (s) => s.user.id === watcher.id
      )[0];
      say(spectator, "hello out", game.spectatorMeeting.id);
      chatTexts(other.socket).should.include("hello out");
      chatTexts(host.socket).should.not.include("hello out");

      game.spectatorMeeting.speak({ sender: outSpectator, content: "from out" });
      chatTexts(watcher.socket).should.include("from out");
      chatTexts(host.socket).should.not.include("from out");
    });

    function quoteInto(meeting, sender, message, fromMeeting, fromState) {
      meeting.quote(sender, {
        messageId: message.id,
        toMeetingId: meeting.id,
        fromMeetingId: (fromMeeting || meeting).id,
        fromState: String(fromState),
        messageContent: message.content,
      });
    }

    function heard(socket) {
      return socket.clientMessages
        .filter((m) => m.eventName === "message" || m.eventName === "quote")
        .map((m) =>
          m.eventName === "quote" ? `quote:${m.data.messageId}` : m.data.content
        );
    }

    it("delivers pregame messages and quotes once to spectators", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });
      const player = playerFor(game, host);
      const spectator = game.spectators[0];

      host.socket.flushMessages();
      watcher.socket.flushMessages();
      game.pregame.speak({ sender: player, content: "from host" });
      game.pregame.speak({ sender: spectator, content: "from spec" });
      const [m1, m2] = game.pregame.messages;
      quoteInto(game.pregame, player, m2, null, -1);
      quoteInto(game.pregame, spectator, m1, null, -1);

      const expected = ["from host", "from spec", `quote:${m2.id}`, `quote:${m1.id}`];
      heard(watcher.socket).should.deep.equal(expected);
      heard(host.socket).should.deep.equal(expected);

      // Quotes carry their own id so the client can drop a repeat.
      const quotes = events(watcher.socket, "quote");
      should.exist(quotes[0].data.id);
      quotes[0].data.id.should.not.equal(quotes[1].data.id);
    });

    it("delivers in-game quotes once and keeps spectator quotes from players", async function () {
      const Meeting = require("../../Games/core/Meeting");
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const other = makeUser(null, "other");
      const watcher = makeUser(null, "watcher");
      const watcher2 = makeUser(null, "watcher2");
      await game.userJoin(host);
      await game.userJoin(other);
      await game.userJoin(watcher, { spectate: true });
      await game.userJoin(watcher2, { spectate: true });
      await startBare(game);

      const village = game.createMeeting(Meeting, "Village");
      village.group = true;
      village.speech = true;
      village.voting = false;
      for (const p of game.players) village.join(p);
      village.init();

      const [p1, p2] = game.players.array();
      const s1 = game.spectators.filter((s) => s.user.id === watcher.id)[0];
      const s2 = game.spectators.filter((s) => s.user.id === watcher2.id)[0];
      for (const u of [host, other, watcher, watcher2]) u.socket.flushMessages();

      village.speak({ sender: p1, content: "village talk" });
      game.spectatorMeeting.speak({ sender: s1, content: "spec talk" });
      const vm = village.messages[0];
      const sm = game.spectatorMeeting.messages[0];
      quoteInto(village, p2, vm, null, game.currentState);
      quoteInto(game.spectatorMeeting, s2, sm, null, game.currentState);
      quoteInto(game.spectatorMeeting, s2, vm, village, game.currentState);

      const spectatorView = [
        "village talk",
        "spec talk",
        `quote:${vm.id}`,
        `quote:${sm.id}`,
        `quote:${vm.id}`,
      ];
      heard(watcher.socket).should.deep.equal(spectatorView);
      heard(watcher2.socket).should.deep.equal(spectatorView);
      // Players get the village message and quote once, no spectator chat.
      heard(host.socket).should.deep.equal(["village talk", `quote:${vm.id}`]);
      heard(other.socket).should.deep.equal(["village talk", `quote:${vm.id}`]);
    });

    it("pregame chat stays shared between players and spectators", async function () {
      const game = await openGame.call(this, { total: 3 });
      const host = makeUser(game.hostId, "host");
      const watcher = makeUser(null, "watcher");
      await game.userJoin(host);
      await game.userJoin(watcher, { spectate: true });

      host.socket.flushMessages();
      watcher.socket.flushMessages();
      say(game.spectators[0], "pregame hello", game.pregame.id);
      say(playerFor(game, host), "host hello", game.pregame.id);

      chatTexts(host.socket).should.include("pregame hello");
      chatTexts(watcher.socket).should.include("host hello");
      should.not.exist(game.spectatorMeeting);
    });
  });
});
