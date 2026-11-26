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
      pregameWaitLength: 1,
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
  this.timeout(5000);

  it("activates ResistanceMode and suppresses Village and faction Kill meetings", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    // makeGame resolves after the game started, so the role-assigned items
    // are still held. Do not poll for game.started: the short test state
    // lengths let a 1-state item like NoVillageMeeting age out first.
    const game = await makeGame(spymasterSetup());
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

  it("skips Team Approval and Mission without Spymaster", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame({
      total: 5,
      roles: [{ Villager: 4, Mafioso: 1 }],
    });

    // chai's should cannot be called on undefined, so check existence first.
    should.not.exist(game.ResistanceMode);
    game.shouldSkipState("Team Approval").should.be.true;
    game.shouldSkipState("Mission").should.be.true;

    // Only a dealt Spymaster registers the mission states, so a game without
    // one has no mission states to enter at all.
    should.not.exist(game.states.find((s) => s.name === "Team Approval"));
    should.not.exist(game.states.find((s) => s.name === "Mission"));
  });

  it("skips Day and runs Team Approval after Dawn", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    // Long enough that the Night poll is reliable; the test state lengths
    // also drive Team Approval and Mission.
    const game = await makeGame(spymasterSetup(), 1000);
    game.shouldSkipState("Day").should.be.true;
    game.shouldSkipState("Team Approval").should.be.false;

    // ResistanceMode is on, so both mission states run; a rejected team
    // skips the Mission state.
    const teamApproval = game.states.find((s) => s.name === "Team Approval");
    const mission = game.states.find((s) => s.name === "Mission");
    teamApproval.skipChecks[0]().should.be.false;
    mission.skipChecks[0]().should.be.false;
    game.currentTeamFail = true;
    mission.skipChecks[0]().should.be.true;
    game.currentTeamFail = false;

    await waitForState(game, /Night/);
    await waitForState(game, /Team Approval/);
    game.getStateName().should.match(/Team Approval/);
  });

  it("gives the current leader Assemble Team at Night", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup(), 1000);
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

    // recordMissionFails expects the mission's team to have been recorded
    // by the leader's Team Approval meeting first.
    game.recordMissionTeam([]);
    game.recordMissionFails(0);
    game.missionRecord.score.rebels.should.equal(1);

    game.recordMissionTeam([]);
    game.recordMissionFails(1);
    game.missionRecord.score.spies.should.equal(1);
  });

  it("awards Village win from rebel mission score threshold", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup({ numMissions: 3 }));
    game.missionRecord.score.rebels = 2;
    const [finished, winners] = game.checkWinConditions();

    finished.should.be.true;
    should.exist(winners.groups["Village"]);
  });

  it("awards Mafia win from spy mission score threshold", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const game = await makeGame(spymasterSetup({ numMissions: 3 }));
    game.missionRecord.score.spies = 2;
    const [finished, winners] = game.checkWinConditions();

    finished.should.be.true;
    should.exist(winners.groups["Mafia"]);
  });
});
