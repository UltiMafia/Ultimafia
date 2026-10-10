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

function obituaryText(game) {
  const texts = [];
  const states = game.history && game.history.states;
  if (!states) return texts;
  for (let state of Object.values(states)) {
    for (let entry of Object.values(state.obituaries || {})) {
      const list = entry && entry.obituaries;
      if (!Array.isArray(list)) continue;
      for (let obituary of list) {
        const snippets = obituary && obituary.snippets;
        if (!snippets) continue;
        for (let snippet of Object.values(snippets)) texts.push(String(snippet));
      }
    }
  }
  return texts;
}

function mentioned(text, player) {
  const name = player.name;
  return (
    text.indexOf(" " + name + " ") != -1 ||
    text.indexOf(" " + name + ",") != -1 ||
    text.indexOf(" " + name + ".") != -1
  );
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
    alerts(game).join("\n").should.not.include("safehouse");
    obituaryText(game).join("\n").should.include("condemned");
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
    text.should.match(
      /Safehouse is on\. The Village wins when 2 Village-aligned players are sent to the safehouse\./
    );
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
        const marker = "housed-night-act";
        let nightVote = null;
        if (kill) nightVote = kill.vote(doctor, kill.targets[0]);
        snap.night = {
          saves: open.filter((meeting) => meeting.name == "Save").length,
          ownMeetings: doctor.getMeetings().map((meeting) => meeting.name),
          nightVote: nightVote,
          killTargets: kill && Array.isArray(kill.targets) ? kill.targets.slice() : [],
          investigateTargets:
            investigate && Array.isArray(investigate.targets)
              ? investigate.targets.slice()
              : [],
          spoke: false,
        };
        if (kill) {
          doctor.user.socket.sendToServer("speak", {
            content: marker,
            meetingId: String(kill.id),
            abilityName: "",
            abilityTarget: "",
          });
          snap.night.spoke = kill.messages.some(
            (message) => message.content == marker
          );
        }
      }
      if (game.getStateName() == "Day" && doctor.housed && !snap.day) {
        const village = open.filter((meeting) => meeting.name == "Village")[0];
        const member = village && village.getMember(doctor);
        const marker = "housed-speech-should-not-land";
        const before = village ? village.messages.length : 0;
        let delivered = false;
        if (village) {
          doctor.user.socket.sendToServer("speak", {
            content: marker,
            meetingId: String(village.id),
            abilityName: "",
            abilityTarget: "",
          });
          for (let player of game.players) {
            for (let message of player.user.socket.clientMessages || []) {
              if (
                message.eventName == "message" &&
                message.data &&
                String(message.data.content || "").indexOf(marker) != -1
              ) {
                delivered = true;
              }
            }
          }
        }
        const other = byRole(game, "Villager").find((p) => p.alive && !p.housed);
        const votesBefore = village ? Object.keys(village.votes).length : 0;
        if (village) village.vote(doctor, other ? other.id : "*");
        snap.day = {
          member: !!member,
          canVote: !!(member && member.canVote),
          canTalk: !!(member && member.canTalk),
          canRead: village
            ? village.getPlayers().some((player) => player.id == doctor.id)
            : false,
          totalVoters: village && village.totalVoters,
          inPlay: game.playersInPlay().length,
          speechRejected:
            !!village && village.messages.length == before && !delivered,
          voteRejected:
            !!village &&
            village.votes[doctor.id] == null &&
            Object.keys(village.votes).length == votesBefore,
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
    snap.night.ownMeetings.should.eql([]);
    should.equal(snap.night.nightVote, false);
    snap.night.spoke.should.equal(false);
    snap.night.killTargets.indexOf(doctor.id).should.equal(-1);
    snap.night.investigateTargets.indexOf(doctor.id).should.equal(-1);
    snap.day.member.should.equal(true);
    snap.day.canVote.should.equal(false);
    snap.day.canTalk.should.equal(false);
    snap.day.canRead.should.equal(true);
    snap.day.speechRejected.should.equal(true);
    snap.day.voteRejected.should.equal(true);
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

  it("houses nobody when the village votes no one", async function () {
    const game = await makeGame({
      total: 5,
      roles: [{ Villager: 4, Mafioso: 1 }],
      gameSettings: { Safehouse: 2 },
      noDeathLimit: 50,
    });

    bindVotes(game, (player, meeting) => {
      if (meeting.name == "Village") return "*";
      const targets = (meeting.targets || []).filter((target) => target != "*");
      return targets.length ? targets[0] : "*";
    });

    await waitFor(() => game.finished);
    for (let player of game.players) player.housed.should.equal(false);
    (game.safehouseVillageHoused || 0).should.equal(0);
    alerts(game).join("\n").should.not.include("was sent to the safehouse");
    should.exist(game.winners.groups["Mafia"]);
    should.not.exist(game.winners.groups["Village"]);
  });

  it("excludes housed players from the majority-vote threshold", async function () {
    const game = await makeGame({
      total: 5,
      roles: [{ Villager: 4, Mafioso: 1 }],
      gameSettings: { Safehouse: 9, "Majority Voting": true },
      noDeathLimit: 50,
    });
    const villagers = byRole(game, "Villager");
    const mafia = byRole(game, "Mafioso")[0];
    const first = villagers[0];
    const second = villagers[1];
    const third = villagers[2];
    const fourth = villagers[3];
    let snap = null;
    let threshold = null;
    let halt = false;

    const originalGoto = game.gotoNextState.bind(game);
    game.gotoNextState = function () {
      if (halt) return;
      return originalGoto();
    };
    const originalCheck = game.checkWinConditions.bind(game);
    game.checkWinConditions = function () {
      const result = originalCheck();
      if (!snap && second.housed) {
        snap = {
          count: game.safehouseVillageHoused || 0,
          finished: !!result[0],
          inPlay: game.playersInPlay().length,
          alive: game.alivePlayers().length,
          groups: result[1] && result[1].groups ? Object.keys(result[1].groups) : [],
        };
        halt = true;
      }
      return result;
    };
    const originalSend = game.sendMeetings.bind(game);
    game.sendMeetings = function (players) {
      // Capture the day after the first housing, before that day's votes resolve.
      if (
        !threshold &&
        game.getStateName() == "Day" &&
        first.housed &&
        !second.housed
      ) {
        const village = villageMeeting(game);
        threshold = {
          totalVoters: village && village.totalVoters,
          inPlay: game.playersInPlay().length,
        };
      }
      return originalSend(players);
    };

    bindVotes(game, (player, meeting) => {
      if (meeting.name != "Village") return choose(meeting, "*");
      if (!first.housed) return choose(meeting, first.id);
      if (player.id == second.id || player.id == third.id)
        return choose(meeting, second.id);
      if (player.id == fourth.id) return choose(meeting, mafia.id);
      if (player.id == mafia.id) return choose(meeting, fourth.id);
      return choose(meeting, "*");
    });

    await waitFor(() => snap && threshold);
    // 5 alive, 1 already housed, 4 voting. Two votes is half of the
    // players still in play and is not a majority of all five alive.
    threshold.totalVoters.should.equal(4);
    threshold.inPlay.should.equal(4);
    snap.count.should.equal(2);
    snap.finished.should.equal(false);
    snap.inPlay.should.equal(3);
    snap.alive.should.equal(5);
    snap.groups.should.not.include("Village");
    snap.groups.should.not.include("Mafia");
    second.housed.should.equal(true);
    second.alive.should.equal(true);
    stop(game);
  });

  it("gives night actions nothing when they target a housed player", async function () {
    const game = await makeGame({
      total: 8,
      roles: [
        {
          Doctor: 1,
          Cop: 1,
          Tracker: 1,
          Watcher: 1,
          Hooker: 1,
          Villager: 3,
        },
      ],
      gameSettings: { Safehouse: 9 },
      noDeathLimit: 50,
    });
    const villagers = byRole(game, "Villager");
    const housed = villagers[0];
    const saveTarget = villagers[1];
    const killTarget = villagers[2];
    const doctor = byRole(game, "Doctor")[0];
    const cop = byRole(game, "Cop")[0];
    const tracker = byRole(game, "Tracker")[0];
    const watcher = byRole(game, "Watcher")[0];
    const hooker = byRole(game, "Hooker")[0];
    const snap = {};
    let halt = false;

    const originalGoto = game.gotoNextState.bind(game);
    game.gotoNextState = function () {
      if (halt) return;
      return originalGoto();
    };
    const originalSend = game.sendMeetings.bind(game);
    game.sendMeetings = function (players) {
      const open = meetings(game);
      const find = (name) => open.filter((meeting) => meeting.name == name)[0];

      if (
        game.getStateName() == "Night" &&
        game.dayCount >= 2 &&
        housed.housed &&
        !snap.night
      ) {
        const attempts = {};
        for (let spec of [
          ["Mafia Kill", hooker],
          ["Save", doctor],
          ["Investigate", cop],
          ["Block", hooker],
          ["Track", tracker],
          ["Watch", watcher],
        ]) {
          const meeting = find(spec[0]);
          const actor = spec[1];
          const targets = meeting && Array.isArray(meeting.targets) ? meeting.targets : [];
          const voted = meeting ? meeting.vote(actor, housed.id) : true;
          attempts[spec[0]] = {
            present: !!meeting,
            listed: targets.indexOf(housed.id) != -1,
            voted: voted,
            recorded: !!(meeting && meeting.votes[actor.id] != null),
          };
        }
        snap.night = {
          attempts: attempts,
          ownMeetings: housed.getMeetings().map((meeting) => meeting.name),
        };
      }

      // Action alerts are still queued here: each state's flush runs after sendMeetings,
      // and these zero-length states resolve reentrantly before that flush.
      if (
        game.getStateName() == "Night" &&
        game.dayCount >= 3 &&
        housed.housed &&
        !snap.reports
      ) {
        const lines = game.alertQueue.items.map((item) => String(item.message));
        snap.reports = {
          track: lines.filter((line) => line.indexOf(":track:") != -1).join("\n"),
          watch: lines.filter((line) => line.indexOf(":watch:") != -1).join("\n"),
          cop: lines.filter((line) => line.indexOf(":invest:") != -1).join("\n"),
          killAlive: killTarget.alive,
          saveAlive: saveTarget.alive,
          housedAlive: housed.alive,
        };
        halt = true;
      }

      return originalSend(players);
    };

    bindVotes(game, (player, meeting) => {
      if (meeting.name == "Village") {
        if (!housed.housed) return choose(meeting, housed.id);
        return choose(meeting, "*");
      }
      if (!housed.housed) return choose(meeting, "*");
      if (meeting.name == "Mafia Kill") return choose(meeting, killTarget.id);
      if (meeting.name == "Save") return choose(meeting, saveTarget.id);
      if (meeting.name == "Investigate") return choose(meeting, hooker.id);
      if (meeting.name == "Block") return choose(meeting, killTarget.id);
      if (meeting.name == "Track") return choose(meeting, doctor.id);
      if (meeting.name == "Watch") return choose(meeting, saveTarget.id);
      return choose(meeting, "*");
    });

    await waitFor(() => snap.night && snap.reports);
    for (let name of [
      "Mafia Kill",
      "Save",
      "Investigate",
      "Block",
      "Track",
      "Watch",
    ]) {
      const attempt = snap.night.attempts[name];
      attempt.present.should.equal(true);
      attempt.listed.should.equal(false);
      attempt.voted.should.equal(false);
      attempt.recorded.should.equal(false);
    }
    snap.night.ownMeetings.should.eql([]);
    snap.reports.killAlive.should.equal(false);
    snap.reports.saveAlive.should.equal(true);
    snap.reports.housedAlive.should.equal(true);
    mentioned(snap.reports.track, saveTarget).should.equal(true);
    mentioned(snap.reports.track, housed).should.equal(false);
    mentioned(snap.reports.watch, doctor).should.equal(true);
    mentioned(snap.reports.watch, housed).should.equal(false);
    mentioned(snap.reports.cop, hooker).should.equal(true);
    mentioned(snap.reports.cop, housed).should.equal(false);
    housed.alive.should.equal(true);
    stop(game);
  });
});
