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

function spymasterSetup(overrides) {
  return {
    total: 5,
    roles: [{ Villager: 3, Spymaster: 1, Mafioso: 1 }],
    numMissions: 5,
    firstTeamSize: 2,
    lastTeamSize: 3,
    teamFailLimit: 5,
    ...overrides,
  };
}

async function makeGame(setup, stateLength) {
  stateLength = stateLength || 100;

  const users = makeUsers(setup.total);
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setup,
      stateLengths: {
        Day: stateLength,
        Night: stateLength,
        "Team Approval": stateLength,
        Mission: stateLength,
      },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();

  for (let user of users) await game.userJoin(user);

  return game;
}

function getRoles(game) {
  var roles = {};
  for (let player of game.players) {
    let roleName = player.role.name;
    if (!roles[roleName]) roles[roleName] = player;
    else if (Array.isArray(roles[roleName])) roles[roleName].push(player);
    else {
      let existingPlayer = roles[roleName];
      roles[roleName] = [];
      roles[roleName].push(existingPlayer);
      roles[roleName].push(player);
    }
  }
  return roles;
}

function waitForResult(check) {
  return new Promise((resolve, reject) => {
    var interval = setInterval(() => {
      try {
        if (check()) {
          clearInterval(interval);
          resolve();
        }
      } catch (e) {
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

describe("Games/Mafia/Spymaster", function () {
  it("activates ResistanceMode and suppresses Village and faction Kill meetings", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup());
    await waitForResult(() => game.started);
    game.ResistanceMode.should.equal(true);
    game.missionRecord.should.exist;

    for (let player of game.players) {
      player.hasItem("NoVillageMeeting").should.be.true;
      player.hasItem("NoMafiaKill").should.be.true;
      player.hasItem("MissionParticipant").should.be.true;
    }

    const mafioso = getRoles(game)["Mafioso"];
    const noKill = mafioso.items.find((i) => i.name === "NoMafiaKill");
    noKill.shouldDisableMeeting("Mafia Kill").should.be.true;
    noKill.shouldDisableMeeting("Mafia Meeting").should.be.false;
    noKill.shouldDisableMeeting("Mafia Action").should.be.false;
  });

  it("skips Day and runs Team Approval after Dawn", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup());
    await waitForResult(() => game.started);
    game.shouldSkipState("Day").should.be.true;
    game.shouldSkipState("Team Approval").should.be.false;

    await waitForState(game, /Night/);
    await waitForState(game, /Team Approval/);
    game.getStateName().should.match(/Team Approval/);
  });

  it("gives the current leader Assemble Team at Night", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup());
    await waitForResult(() => game.started);
    await waitForState(game, /Night/);

    const leader = game.currentLeader;
    leader.hasItem("MissionLeader").should.be.true;

    for (let player of game.players) {
      if (player === leader) continue;
      player.hasItem("MissionLeader").should.be.false;
    }
  });

  it("records mission score on success and failure", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup({ teamFailLimit: 1 }));
    await waitForResult(() => game.started);

    game.recordMissionFails(0);
    game.missionRecord.score.rebels.should.equal(1);

    game.recordMissionFails(1);
    game.missionRecord.score.spies.should.equal(1);
  });

  it("awards Village win from rebel mission score threshold", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup({ numMissions: 3 }));
    await waitForResult(() => game.started);
    game.missionRecord.score.rebels = 2;
    const [finished, winners] = game.checkWinConditions();

    finished.should.be.true;
    should.exist(winners.groups["Village"]);
  });

  it("awards Mafia win from spy mission score threshold", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup({ numMissions: 3 }));
    await waitForResult(() => game.started);
    game.missionRecord.score.spies = 2;
    const [finished, winners] = game.checkWinConditions();

    finished.should.be.true;
    should.exist(winners.groups["Mafia"]);
  });
});
