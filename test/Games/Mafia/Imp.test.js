const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should();
const db = require("../../../db/db");
const redis = require("../../../modules/redis");
const shortid = require("shortid");
const Game = require("../../../Games/types/Mafia/Game");
const User = require("../../../Games/core/User");
const Socket = require("../../../lib/sockets").TestSocket;

function makeUser() {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    isTest: true,
  });
}

function makeUsers(amt) {
  var users = [];

  for (let i = 0; i < amt; i++) users.push(makeUser());

  return users;
}

async function makeGame(setup, stateLength) {
  stateLength = stateLength || 0;

  const users = makeUsers(setup.total);
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setup,
      stateLengths: {
        Day: stateLength,
        Night: stateLength,
      },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();
  // 3 Cult vs 3 Village is already a Cult majority. Hold wins so night runs.
  game.checkWinConditions = function () {
    return [false];
  };

  for (let user of users) await game.userJoin(user);

  return game;
}

function addListenerToPlayer(player, eventName, action) {
  player.user.socket.onClientEvent(eventName, action);
}

function addListenerToPlayers(players, eventName, action) {
  for (let player of players) addListenerToPlayer(player, eventName, action);
}

function waitForResult(check, timeoutMs) {
  timeoutMs = timeoutMs || 15000;

  return new Promise((resolve, reject) => {
    var startedAt = Date.now();
    var interval = setInterval(() => {
      try {
        if (check()) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startedAt > timeoutMs) {
          clearInterval(interval);
          reject(new Error("timed out waiting for game condition"));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, 100);
  });
}

function waitForState(game, statePattern) {
  return waitForResult(() => {
    const name = game.getStateName();
    return name && name.match(statePattern);
  });
}

function aliveWithRole(game, roleName) {
  return game.players.filter(
    (p) => p.alive && p.role && p.role.name == roleName
  );
}

async function impTargetsSelf(options) {
  options = options || {};
  await db.promise;
  await redis.client.flushdbAsync();

  const setup = { total: 6, roles: [{ Imp: 1, Cultist: 2, Villager: 3 }] };
  const game = await makeGame(setup, 30000);
  const imp = game.players.filter((p) => p.role.name == "Imp")[0];
  const cultistIds = game.players
    .filter((p) => p.role.name == "Cultist")
    .map((p) => p.id);

  if (options.sabbath) {
    for (let player of game.players) player.setTempImmunity("kill", 10);
  }
  if (options.permanentImmunity) {
    imp.giveEffect("Kill Immune", 5, Infinity);
  }

  // A vote resends the meeting, and TestSocket replays that into this listener.
  addListenerToPlayers(game.players, "meeting", function (meeting) {
    if (!this.votedMeetings) this.votedMeetings = {};
    if (this.votedMeetings[meeting.id]) return;

    if (meeting.name == "Kill") {
      this.votedMeetings[meeting.id] = true;
      this.sendToServer("vote", {
        selection: imp.id,
        meetingId: meeting.id,
      });
    } else if (meeting.name == "Cult Action") {
      this.votedMeetings[meeting.id] = true;
      this.sendToServer("vote", {
        selection: "Yes",
        meetingId: meeting.id,
      });
    }
  });

  try {
    await waitForState(game, /^Day/);
  } catch (e) {
    if (!game.finished) game.immediateEnd();
    throw e;
  }

  return { game, imp, cultistIds };
}

function endGame(game) {
  if (game && !game.finished) game.immediateEnd();
}

describe("Games/Mafia/Imp", function () {
  this.timeout(20000);

  it("passes the role to one Cultist when the Imp kills themself", async function () {
    const { game, imp, cultistIds } = await impTargetsSelf();

    try {
      imp.alive.should.be.false;
      const livingImps = aliveWithRole(game, "Imp");
      livingImps.should.have.lengthOf(1);
      cultistIds.indexOf(livingImps[0].id).should.not.equal(-1);
      aliveWithRole(game, "Cultist").should.have.lengthOf(1);
    } finally {
      endGame(game);
    }
  });

  it("does not convert a Cultist when Sabbath kill immunity blocks the self-kill", async function () {
    const { game, imp, cultistIds } = await impTargetsSelf({ sabbath: true });

    try {
      imp.alive.should.be.true;
      imp.role.name.should.equal("Imp");
      aliveWithRole(game, "Imp").should.have.lengthOf(1);
      const cultists = aliveWithRole(game, "Cultist");
      cultists.should.have.lengthOf(2);
      for (let cultist of cultists)
        cultistIds.indexOf(cultist.id).should.not.equal(-1);
    } finally {
      endGame(game);
    }
  });

  it("does not pass when the Imp has permanent kill immunity", async function () {
    const { game, imp, cultistIds } = await impTargetsSelf({
      permanentImmunity: true,
    });

    try {
      imp.alive.should.be.true;
      imp.role.name.should.equal("Imp");
      aliveWithRole(game, "Imp").should.have.lengthOf(1);
      aliveWithRole(game, "Cultist").should.have.lengthOf(2);
      for (let id of cultistIds) {
        const cultist = game.players.filter((p) => p.id == id)[0];
        cultist.alive.should.be.true;
        cultist.role.name.should.equal("Cultist");
      }
    } finally {
      endGame(game);
    }
  });
});
