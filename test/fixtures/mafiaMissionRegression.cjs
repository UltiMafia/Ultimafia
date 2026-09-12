// Run in a disposable process: reuse only the fuzzer's service substitutions.
require("../../scripts/mafia-fuzz/worker");
const assert = require("assert/strict");
const Game = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;
const Timer = require("../../Games/core/Timer");
Timer.prototype.start = function () { this.startTime = Date.now(); };

async function makeGame(teamFailLimit = 3) {
  const game = new Game({ id: "mission-regression", hostId: "user0", isTest: true,
    settings: { setup: { total: 5, roles: [{ Villager: 3, Spymaster: 1, Mafioso: 1 }],
      numMissions: 5, firstTeamSize: 2, lastTeamSize: 3, teamFailLimit },
    stateLengths: { Day: 60000, Night: 60000, "Team Approval": 60000, Mission: 60000 } } });
  await game.init();
  for (let i = 0; i < 5; i++) {
    await game.userJoin(new User({ id: `user${i}`, name: `Player${i}`,
      socket: new Socket(), settings: {}, isTest: true }), true);
  }
  await new Promise(setImmediate);
  assert.equal(game.started, true);
  return game;
}

function reach(game, state) {
  for (let i = 0; i < 12 && game.getStateName() !== state; i++) {
    assert.ok(!game.finished, "Game ended before " + state);
    assert.ok(game.timers.main, "Missing timer before " + state);
    game.timers.main.end();
  }
  assert.equal(game.getStateName(), state);
}

function approve(game, selection) {
  const meeting = [...game.meetings].find(m => m.name === "Approve Team");
  assert.ok(meeting);
  for (const member of Object.values(meeting.members)) {
    member.player.user.socket.sendToServer("vote", { meetingId: meeting.id, selection });
  }
}

async function run(name) {
  if (name === "integrity") {
    for (const isTest of [false, true]) {
      const game = Object.create(Game.prototype);
      game.isTest = isTest;
      game.hasIntegrity = true;
      const alerts = [];
      game.queueAlert = text => alerts.push(text);
      assert.equal(game.breakIntegrity(), true);
      assert.equal(game.hasIntegrity, false);
      assert.equal(game.breakIntegrity(), false);
      assert.equal(alerts.length, 1);
      if (isTest) {
        // These must remain safe without any database connection.
        await game.refundHeartsForIntegrityBreak(null, true, true);
        await game.penalizePlayerForLeaving("user0");
      }
    }
    return;
  }
  const game = await makeGame(name === "retry-limit" ? 1 : 3);
  try {
    if (name === "scoring") {
      assert.equal(game.recordMissionFails(0), false);
      game.recordMissionTeam([]);
      assert.equal(game.recordMissionFails(0), false);
      assert.deepEqual(game.missionRecord.score, { rebels: 0, spies: 0 });
      assert.equal(game.missionRecord.missionHistory.length, 0);
      game.recordMissionTeam(["Player0", "Player1"]);
      assert.equal(game.recordMissionFails(0), true);
      game.recordMissionTeam(["Player0", "Player1"]);
      assert.equal(game.recordMissionFails(1), true);
      assert.deepEqual(game.missionRecord.score, { rebels: 1, spies: 1 });
      return;
    }
    reach(game, "Night");
    if (["approved", "rejected", "approval-timeout"].includes(name)) {
      // Set up a completed selection; exercise actual approval votes and
      // state transitions, independently of Assemble Team's item behavior.
      game.recordMissionTeam(["Player0", "Player1"]);
    }
    reach(game, "Team Approval");
    if (name === "approval-timeout") {
      const meeting = [...game.meetings].find(m => m.name === "Approve Team");
      const members = Object.values(meeting.members);
      // Leave one vote outstanding so the deadline resolves the rejection.
      for (const member of members.slice(0, -1)) {
        member.player.user.socket.sendToServer("vote", { meetingId: meeting.id, selection: "No" });
      }
      game.timers.main.end();
    } else {
      approve(game, name === "rejected" ? "No" : "Yes");
    }
    if (name === "approved") {
      assert.equal(game.currentTeamFail, false);
      assert.ok(game.getStateName() === "Mission" || game.missionRecord.score.rebels === 1);
      return;
    }
    reach(game, "Night");
    assert.equal(game.missionRecord.score.rebels, 0);
    assert.equal(game.currentMissionHistory, null);
    assert.equal(game.teamApproved, false);
    if (name === "retry-limit") {
      assert.equal(game.missionRecord.score.spies, 1);
      assert.equal(game.missionRecord.missionHistory[0].numFails, -1);
      assert.equal(game.mission, 2);
    } else {
      assert.equal(game.mission, 1);
      assert.equal(game.teamFails, 1);
      assert.equal(game.missionRecord.missionHistory.length, 0);
    }
  } finally {
    game.clearTimers();
  }
}
run(process.argv[2]).then(() => process.exit(0)).catch(error => {
  console.error(error.stack);
  process.exit(1);
});
