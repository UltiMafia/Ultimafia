const dotenv = require("dotenv").config();
const chai = require("chai");
const should = chai.should();
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

async function makeGame(setup) {
  const users = [];
  for (let i = 0; i < setup.total; i++) users.push(makeUser());

  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setup,
      stateLengths: { Day: 0, Night: 0 },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();
  for (let user of users) await game.userJoin(user);
  return game;
}

function byRole(game, name) {
  return game.players.filter((player) => player.role && player.role.name == name);
}

function waitFor(check, timeout) {
  timeout = timeout || 8000;
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      try {
        if (check()) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error("timed out"));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 20);
  });
}

function stop(game) {
  game.finished = true;
  if (typeof game.clearTimers == "function") game.clearTimers();
}

function bindVotes(game, decide) {
  const bySocket = new Map();
  const voted = new Set();
  for (let player of game.players) bySocket.set(player.user.socket, player);

  for (let player of game.players) {
    player.user.socket.onClientEvent("meeting", function (meeting) {
      const voter = bySocket.get(this);
      if (!meeting.voting || !voter || game.finished) return;
      const voteKey = voter.id + ":" + meeting.id;
      if (voted.has(voteKey)) return;
      const selection = decide(voter, meeting);
      if (selection == null) return;
      voted.add(voteKey);
      this.sendToServer("vote", {
        selection: selection,
        meetingId: meeting.id,
      });
    });
  }
}

function choose(meeting, preferred) {
  const targets = meeting.targets || [];
  if (preferred != null && targets.indexOf(preferred) != -1) return preferred;
  if (targets.indexOf("*") != -1) return "*";
  return targets.length ? targets[0] : null;
}

function alerts(game) {
  const texts = [];
  const states = game.history && game.history.states;
  if (!states) return texts;
  for (let state of Object.values(states)) {
    for (let alert of state.alerts || []) {
      if (alert && alert.content) texts.push(String(alert.content));
    }
  }
  return texts;
}

function meetings(game) {
  return typeof game.getMeetings == "function" ? game.getMeetings() : [];
}

function villageMeeting(game) {
  return meetings(game).filter((meeting) => meeting.name == "Village")[0];
}

describe("Safehouse", function () {
  this.timeout(20000);

  before(async function () {
    await db.promise;
  });

  beforeEach(async function () {
    await redis.client.flushdbAsync();
  });

  it("condemns as usual when the setting is off", async function () {
    const game = await makeGame({
      total: 3,
      roles: [{ Villager: 2, Mafioso: 1 }],
    });
    const mafia = byRole(game, "Mafioso")[0];

    bindVotes(game, (player, meeting) => {
      if (meeting.name == "Village") return choose(meeting, mafia.id);
      return choose(meeting);
    });

    await waitFor(() => game.finished);
    mafia.alive.should.equal(false);
    mafia.housed.should.equal(false);
    should.exist(game.winners.groups["Village"]);
    alerts(game).join("\n").should.not.include("Safehouse");
  });

  it("houses the day vote instead of condemning and alerts the quota", async function () {
    const game = await makeGame({
      total: 5,
      roles: [{ Villager: 4, Mafioso: 1 }],
      gameSettings: { Safehouse: 2 },
    });
    const villagers = byRole(game, "Villager");
    const mafia = byRole(game, "Mafioso")[0];
    const first = villagers[0];
    const second = villagers[1];

    bindVotes(game, (player, meeting) => {
      if (meeting.name == "Village") {
        if (!first.housed) return choose(meeting, first.id);
        if (!second.housed) return choose(meeting, second.id);
      }
      return choose(meeting);
    });

    await waitFor(() => game.finished);
    first.housed.should.equal(true);
    second.housed.should.equal(true);
    first.alive.should.equal(true);
    second.alive.should.equal(true);
    mafia.alive.should.equal(true);
    game.safehouseVillageHoused.should.equal(2);
    should.exist(game.winners.groups["Village"]);
    should.not.exist(game.winners.groups["Mafia"]);
    const text = alerts(game).join("\n");
    text.should.include("Safehouse is on");
    text.should.include("2");
    text.should.include(`${first.name} was sent to the safehouse.`);
    text.should.not.include("Villager");
  });

  it("does not advance the quota when a Mafia player is housed", async function () {
    const game = await makeGame({
      total: 4,
      roles: [{ Villager: 3, Mafioso: 1 }],
      gameSettings: { Safehouse: 2 },
      noDeathLimit: 50,
    });
    const mafia = byRole(game, "Mafioso")[0];
    let snap = null;
    let halt = false;

    // Votes resolve synchronously and the game will run until the meteor
    // unless the transition after this housing is stopped.
    const originalGoto = game.gotoNextState.bind(game);
    game.gotoNextState = function () {
      if (halt) return;
      return originalGoto();
    };
    const originalCheck = game.checkWinConditions.bind(game);
    game.checkWinConditions = function () {
      const result = originalCheck();
      if (mafia.housed && !snap) {
        const winners = result[1];
        snap = {
          count: game.safehouseVillageHoused || 0,
          alive: mafia.alive,
          housed: mafia.housed,
          finished: !!result[0],
          groups: winners && winners.groups ? Object.keys(winners.groups) : [],
        };
        halt = true;
      }
      return result;
    };

    bindVotes(game, (player, meeting) => {
      if (meeting.name == "Village") return choose(meeting, mafia.id);
      if (meeting.name == "Mafia Kill") {
        const villager = byRole(game, "Villager").find((p) => p.alive && !p.housed);
        return choose(meeting, villager && villager.id);
      }
      return choose(meeting);
    });

    await waitFor(() => snap);
    snap.count.should.equal(0);
    snap.housed.should.equal(true);
    snap.alive.should.equal(true);
    snap.finished.should.equal(false);
    snap.groups.should.not.include("Mafia");
    snap.groups.should.not.include("Village");
    stop(game);
  });

  it("gives Mafia parity from players still in play", async function () {
    const game = await makeGame({
      total: 5,
      roles: [{ Villager: 3, Mafioso: 2 }],
      gameSettings: { Safehouse: 9 },
    });
    const villager = byRole(game, "Villager")[0];

    bindVotes(game, (player, meeting) => {
      if (meeting.name == "Village") return choose(meeting, villager.id);
      return choose(meeting);
    });

    await waitFor(() => game.finished);
    villager.housed.should.equal(true);
    villager.alive.should.equal(true);
    game.playersInPlay().length.should.equal(4);
    should.exist(game.winners.groups["Mafia"]);
    should.not.exist(game.winners.groups["Village"]);
  });

  it("keeps a housed player from voting, speaking, acting, or being targeted", async function () {
    // Extra villagers keep Mafia short of parity after the Doctor is housed
    // and after the night kill, so the game still reaches the next night and day.
    const game = await makeGame({
      total: 7,
      roles: [{ Doctor: 1, Cop: 1, Villager: 4, Mafioso: 1 }],
      gameSettings: { Safehouse: 9 },
      noDeathLimit: 50,
    });
    const doctor = byRole(game, "Doctor")[0];
    const snap = {};

    // sendMeetings runs after targets are built and before votes advance the
    // state, so the snapshot is not taken from a later phase.
    const originalSend = game.sendMeetings.bind(game);
    game.sendMeetings = function (players) {
      const open = meetings(game);
      if (game.getStateName() == "Night" && game.dayCount >= 2 && doctor.housed && !snap.night) {
        const kill = open.filter((meeting) => meeting.name == "Mafia Kill")[0];
        const investigate = open.filter((meeting) => meeting.name == "Investigate")[0];
        snap.night = {
          saves: open.filter((meeting) => meeting.name == "Save").length,
          killTargets: kill && Array.isArray(kill.targets) ? kill.targets.slice() : [],
          investigateTargets:
            investigate && Array.isArray(investigate.targets)
              ? investigate.targets.slice()
              : [],
        };
      }
      if (game.getStateName() == "Day" && doctor.housed && !snap.day) {
        const village = open.filter((meeting) => meeting.name == "Village")[0];
        const member = village && village.getMember(doctor);
        snap.day = {
          member: !!member,
          canVote: !!(member && member.canVote),
          canTalk: !!(member && member.canTalk),
          canRead: village
            ? village.getPlayers().some((player) => player.id == doctor.id)
            : false,
          totalVoters: village && village.totalVoters,
          inPlay: game.playersInPlay().length,
        };
      }
      return originalSend(players);
    };

    bindVotes(game, (player, meeting) => {
      if (meeting.name == "Village") {
        if (!doctor.housed) return choose(meeting, doctor.id);
        return choose(meeting, "*");
      }
      if (
        meeting.name == "Mafia Kill" ||
        meeting.name == "Investigate" ||
        meeting.name == "Save"
      ) {
        const villager = byRole(game, "Villager").find((p) => p.alive && !p.housed);
        return choose(meeting, villager && villager.id);
      }
      return choose(meeting);
    });

    await waitFor(() => snap.night && snap.day);
    snap.night.saves.should.equal(0);
    snap.night.killTargets.indexOf(doctor.id).should.equal(-1);
    snap.night.investigateTargets.indexOf(doctor.id).should.equal(-1);
    snap.day.member.should.equal(true);
    snap.day.canVote.should.equal(false);
    snap.day.canTalk.should.equal(false);
    snap.day.canRead.should.equal(true);
    snap.day.totalVoters.should.equal(snap.day.inPlay);
    doctor.alive.should.equal(true);
    stop(game);
  });

  it("still forbids condemning no one when Must Condemn is on", async function () {
    const game = await makeGame({
      total: 3,
      roles: [{ Villager: 2, Mafioso: 1 }],
      gameSettings: { Safehouse: 1, "Must Condemn": true },
    });
    const villager = byRole(game, "Villager")[0];
    let sawStar = false;

    bindVotes(game, (player, meeting) => {
      if (meeting.name == "Village") {
        if ((meeting.targets || []).indexOf("*") != -1) sawStar = true;
        return choose(meeting, villager.id);
      }
      return choose(meeting);
    });

    await waitFor(() => game.finished);
    sawStar.should.equal(false);
    villager.housed.should.equal(true);
    villager.alive.should.equal(true);
    should.exist(game.winners.groups["Village"]);
  });
});
