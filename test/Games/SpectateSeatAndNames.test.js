const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should();
const db = require("../../db/db");
const redis = require("../../modules/redis");
const Game = require("../../Games/core/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;

let seq = 0;

function nextId(prefix) {
  seq += 1;
  return `${prefix}ssn${seq}`;
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

function say(person, content, meetingId) {
  person.socket.sendToServer("speak", {
    content,
    meetingId: String(meetingId || ""),
    abilityName: "",
    abilityTarget: "",
  });
}

// Two lines from one person closer than a few hundred ms trip the chat spam
// limit, so tests wait longer between lines from the same person.
function settle(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 50));
}

async function makeGame(extra) {
  extra = extra || {};
  const game = new Game({
    id: nextId("g"),
    hostId: extra.hostId || nextId("h"),
    settings: {
      setup: { id: "setup", total: extra.total || 3 },
      private: true,
      ranked: false,
      competitive: false,
      spectating: true,
      readyCheck: true,
      stateLengths: { Day: 1000, Night: 1000 },
    },
    isTest: true,
  });
  await game.init();
  // isTest would start as soon as the seats fill, skipping the ready check.
  game.checkGameStart = () => {};
  return game;
}

// start() without roles or states. Records how many players roles were
// dealt to, and holds the start on a slow step (like the heart charge and
// stock snapshot of a ranked game) so a seat change can land in between.
function instrumentStart(game, holdMs) {
  const dealt = [];
  game.assignRoles = () => dealt.push(game.players.length);
  game.captureStartingFactions = () => {};
  game.gotoNextState = () => {};
  game.makeMeetings = () => {};
  if (holdMs) {
    game.ranked = true;
    game.chargeHeartsAtStart = () => settle(holdMs);
  }
  return dealt;
}

// A seated player opening the game with ?spectate=true: a new connection
// for the same user that asks to give up the seat.
async function spectateFromSeat(game, user) {
  const again = makeUser(user.id, user.name);
  await game.userJoin(again, { spectate: true });
  return again;
}

function playerFor(game, user) {
  return game.players.array().filter((p) => p.user.id === user.id)[0];
}

// Every sender of a chat message in the last history this socket got, which
// the "players" and "spectators" payloads it got cannot name.
function unnamedSenders(socket) {
  const named = {};
  for (const e of events(socket, "players")) Object.assign(named, e.data);
  for (const e of events(socket, "spectators")) Object.assign(named, e.data);
  const history = events(socket, "history").slice(-1)[0];
  const missing = [];
  (function walk(node) {
    if (!node || typeof node != "object") return;
    if (node.senderId && node.content !== undefined) {
      const id = node.senderId;
      const known = named[id] && named[id].name;
      if (id != "server" && id != "anonymous" && !known)
        missing.push(`${id}: ${node.content}`);
    }
    for (const key in node) walk(node[key]);
  })(history && history.data);
  return missing;
}

describe("Games/SpectateSeatAndNames", function () {
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

  async function fullTable(game, total) {
    const users = [makeUser(game.hostId, "host")];
    for (let i = 1; i < total; i++) users.push(makeUser(null, `p${i}`));
    for (const user of users) await game.userJoin(user);
    await settle();
    return users;
  }

  describe("a seat cannot open once the start has begun", function () {
    it("never deals roles to fewer players than the setup", async function () {
      const game = await openGame.call(this, { total: 3 });
      const dealt = instrumentStart(game);
      await game.userJoin(makeUser(game.hostId, "host"));
      await game.userJoin(makeUser(null, "p1"));

      await game.start();

      dealt.should.have.lengthOf(0);
      (!!game.started).should.equal(false);
      (!!game.starting).should.equal(false);
    });

    it("refuses ?spectate=true while the start is in progress, so all 3 get roles", async function () {
      const game = await openGame.call(this, { total: 3 });
      const dealt = instrumentStart(game, 150);
      const users = await fullTable(game, 3);
      const starting = game.start();
      await settle(20);
      await spectateFromSeat(game, users[2]);
      await starting;
      await settle();

      dealt.should.deep.equal([3]);
      (!!game.started).should.equal(true);
      game.players.length.should.equal(3);
      should.exist(playerFor(game, users[2]));
      game.spectators.should.have.lengthOf(0);
    });

    it("goes back to pregame if someone leaves while the start is in progress", async function () {
      const game = await openGame.call(this, { total: 3 });
      const dealt = instrumentStart(game, 150);
      const users = await fullTable(game, 3);

      const starting = game.start();
      await settle(20);
      users[2].socket.sendToServer("leave");
      await starting;
      await settle();

      dealt.should.have.lengthOf(0);
      (!!game.started).should.equal(false);
      (!!game.starting).should.equal(false);
      game.isReadyCheckActive.should.equal(false);
      should.not.exist(game.timers["pregameCountdown"]);
      game.players.length.should.equal(2);
    });

    it("moving a player to spectators during the ready check cancels it", async function () {
      const game = await openGame.call(this, { total: 3 });
      const dealt = instrumentStart(game);
      const users = await fullTable(game, 3);
      game.startReadyCheck();
      game.playerReady(playerFor(game, users[0]));
      game.playerReady(playerFor(game, users[1]));

      await game.movePlayerToSpectator(playerFor(game, users[2]), {
        alert: "p2 is now spectating.",
      });

      game.isReadyCheckActive.should.equal(false);
      should.not.exist(game.timers["pregameCountdown"]);
      game.checkAllPlayersReady();
      should.not.exist(game.timers["pregameCountdown"]);
      dealt.should.have.lengthOf(0);
    });

    it("?spectate=true after everyone readied stops the start countdown", async function () {
      const game = await openGame.call(this, { total: 3 });
      game.pregameCountdownLength = 50;
      const dealt = instrumentStart(game);
      const users = await fullTable(game, 3);
      game.startReadyCheck();
      for (const user of users) game.playerReady(playerFor(game, user));
      should.exist(game.timers["pregameCountdown"]);

      await spectateFromSeat(game, users[2]);
      await settle(150);

      should.not.exist(game.timers["pregameCountdown"]);
      dealt.should.have.lengthOf(0);
      (!!game.started).should.equal(false);
      game.players.length.should.equal(2);
    });
  });

  describe("names in chat after a refresh", function () {
    it("a player who moved to spectators keeps their name on pregame messages", async function () {
      const game = await openGame.call(this, { total: 3 });
      const users = await fullTable(game, 2);
      const mover = playerFor(game, users[1]);
      say(mover, "said as a player", game.pregame.id);
      // Past the chat spam limit before the next line.
      await settle(400);
      await spectateFromSeat(game, users[1]);
      await settle();
      should.exist(game.spectators.filter((s) => s.user.id === users[1].id)[0]);

      // A refresh is a new connection that gets the full game state.
      const host = makeUser(game.hostId, "host");
      users[0].socket.sendToServer("disconnected");
      await game.userJoin(host);
      await settle();
      unnamedSenders(host.socket).should.deep.equal([]);

      const watcher = makeUser(null, "watcher");
      await game.userJoin(watcher, { spectate: true });
      await settle();
      unnamedSenders(watcher.socket).should.deep.equal([]);
    });

    it("a player moved by a missed ready check keeps their name after the start", async function () {
      const game = await openGame.call(this, { total: 3 });
      const users = await fullTable(game, 3);
      say(playerFor(game, users[2]), "before the ready check", game.pregame.id);
      await settle();
      game.startReadyCheck();
      await game.failReadyCheck();
      await settle();

      await game.userJoin(makeUser(null, "p3"));
      await settle();
      instrumentStart(game);
      await game.start();
      await settle();

      const again = makeUser(game.hostId, "host");
      users[0].socket.sendToServer("disconnected");
      await game.userJoin(again);
      await settle();
      unnamedSenders(again.socket).should.deep.equal([]);
    });
  });

  describe("where spectators can talk", function () {
    it("ignores a spectator speaking into a meeting other than Pregame or spectator chat", async function () {
      const game = await openGame.call(this, { total: 3 });
      const users = await fullTable(game, 2);
      const watcher = makeUser(null, "watcher");
      await game.userJoin(watcher, { spectate: true });
      await settle();
      const spectator = game.spectators[0];

      // Even if a spectator somehow ended up in a player meeting, the server
      // must not accept their speech there.
      const Meeting = require("../../Games/core/Meeting");
      const meeting = game.createMeeting(Meeting, "Mafia");
      meeting.group = true;
      meeting.speech = true;
      meeting.anonymous = true;
      for (const user of users) meeting.join(playerFor(game, user));
      meeting.join(spectator);
      meeting.init();

      say(spectator, "sneaky", meeting.id);
      await settle(400);
      meeting.messages.map((m) => m.content).should.not.include("sneaky");

      say(spectator, "hi from pregame", game.pregame.id);
      await settle();
      game.pregame.messages.map((m) => m.content).should.include("hi from pregame");
    });
  });
});
