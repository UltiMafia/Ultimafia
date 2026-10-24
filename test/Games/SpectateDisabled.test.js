const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const db = require("../../db/db");
const redis = require("../../modules/redis");
const routeUtils = require("../../routes/utils");
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
// start() refuses a short table, so the setup is sized to the players seated.
async function startBare(game) {
  game.setup.total = game.players.length;
  game.assignRoles = () => {};
  game.captureStartingFactions = () => {};
  game.gotoNextState = () => {};
  await game.start();
  game.makeMeetings();
}

function playerFor(game, user) {
  return game.players.array().filter((p) => p.user.id === user.id)[0];
}

describe("Games/SpectateDisabled", function () {
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

  // Runs fn as if every user had canSpectateAny (staff).
  async function asStaff(fn) {
    const original = routeUtils.verifyPermission;
    routeUtils.verifyPermission = async (...args) =>
      args.includes("canSpectateAny") || original.apply(routeUtils, args);
    try {
      return await fn();
    } finally {
      routeUtils.verifyPermission = original;
    }
  }

  async function seat(game, names) {
    const users = [];
    for (const name of names) {
      const user =
        name === "host" ? makeUser(game.hostId, "host") : makeUser(null, name);
      await game.userJoin(user);
      users.push(user);
    }
    await settle();
    return users;
  }

  describe("with spectating off", function () {
    it("the game setting is strictly true (the string \"false\" stays off)", async function () {
      const game = await openGame.call(this, { total: 3 });
      const off = new Game({
        id: nextId("g"),
        hostId: nextId("h"),
        settings: {
          setup: { id: "setup", total: 3 },
          spectating: "false",
          stateLengths: { Day: 1000, Night: 1000 },
        },
        isTest: true,
      });
      off.spectating.should.equal(false);
      game.spectating.should.equal(true);
    });

    it("the Spectate button (spectate event) is refused and the player keeps the seat", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const [host, other] = await seat(game, ["host", "other"]);
      other.socket.flushMessages();
      other.socket.sendToServer("spectate");
      await settle();

      should.exist(playerFor(game, other));
      game.players.should.have.lengthOf(2);
      game.spectators.should.have.lengthOf(0);
      events(other.socket, "spectateFailed").should.have.lengthOf(1);
    });

    it("no server path moves a player to spectators (movePlayerToSpectator)", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const [, other] = await seat(game, ["host", "other"]);
      const result = await game.movePlayerToSpectator(playerFor(game, other), {
        alert: "moved",
      });
      should.not.exist(result);
      should.exist(playerFor(game, other));
      game.spectators.should.have.lengthOf(0);
    });

    it("a staff player who misses the ready check is removed, not moved", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const users = await seat(game, ["host", "a", "staff"]);
      await asStaff(async () => {
        game.startReadyCheck();
        game.playerReady(playerFor(game, users[0]));
        game.playerReady(playerFor(game, users[1]));
        await game.failReadyCheck();
        await settle();
      });

      should.not.exist(playerFor(game, users[2]));
      game.spectators.should.have.lengthOf(0);
      events(users[2].socket, "left").should.have.lengthOf(1);
    });

    it("staff can still choose to spectate (/spectate)", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const [host, staff] = await seat(game, ["host", "staff"]);
      await asStaff(async () => {
        say(playerFor(game, staff), "/spectate", game.pregame.id);
        await settle();
      });

      should.not.exist(playerFor(game, staff));
      game.spectators.filter((s) => s.user.id === staff.id).should.have.lengthOf(1);
    });

    it("a non-staff /spectate is refused", async function () {
      const game = await openGame.call(this, { total: 3, spectating: false });
      const [, other] = await seat(game, ["host", "other"]);
      other.socket.flushMessages();
      say(playerFor(game, other), "/spectate", game.pregame.id);
      await settle();
      should.exist(playerFor(game, other));
      game.spectators.should.have.lengthOf(0);
      chatTexts(other.socket).should.include(
        ":system: Spectating is not enabled for this game."
      );
    });
  });

  describe("with spectating on", function () {
    it("a missed ready check the move cannot complete still removes the player", async function () {
      const game = await openGame.call(this, { total: 3 });
      const users = await seat(game, ["host", "a", "late"]);
      game.movePlayerToSpectator = async () => null;
      game.startReadyCheck();
      game.playerReady(playerFor(game, users[0]));
      game.playerReady(playerFor(game, users[1]));
      await game.failReadyCheck();
      await settle();

      should.not.exist(playerFor(game, users[2]));
      game.players.should.have.lengthOf(2);
    });

    it("the Spectate button still moves a player to spectators", async function () {
      const game = await openGame.call(this, { total: 3 });
      const [, other] = await seat(game, ["host", "other"]);
      other.socket.sendToServer("spectate");
      await settle();
      should.not.exist(playerFor(game, other));
      game.spectators.filter((s) => s.user.id === other.id).should.have.lengthOf(1);
    });
  });
});
