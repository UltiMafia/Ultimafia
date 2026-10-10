const dotenv = require("dotenv").config();
const chai = require("chai");
const should = chai.should();
const db = require("../../../db/db");
const redis = require("../../../modules/redis");
const shortid = require("shortid");
const Game = require("../../../Games/types/Mafia/Game");
const User = require("../../../Games/core/User");
const Socket = require("../../../lib/sockets").TestSocket;
const Random = require("../../../lib/Random");
const Action = require("../../../Games/types/Mafia/Action");
const {
  PRIORITY_NIGHT_SAVER,
  PRIORITY_KILL_DEFAULT,
} = require("../../../Games/types/Mafia/const/Priority");

// Production phases are 45s. Tests use a short clock and assert it still elapses.
const CONVERSION_TEST_MS = 300;

function makeUser() {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    isTest: true,
  });
}

async function makeGame(setup, onStart) {
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
  for (let state of game.states) {
    if (
      state.name == "Night (Becoming)" ||
      state.name == "Night (Swapping)" ||
      state.name == "Night (Converting)"
    ) {
      state.length = CONVERSION_TEST_MS;
    }
  }
  game.events.on("start", () => {
    game.enteredStates = [];
    game.phaseTimes = [];
    game._phaseMark = null;
    game._snap = null;
    game.events.on("state", () => {
      const now = Date.now();
      const name = game.getStateName();
      if (game._phaseMark) {
        game.phaseTimes.push({
          name: game._phaseMark.name,
          ms: now - game._phaseMark.at,
        });
      }
      game._phaseMark = { name: name, at: now };
      game.enteredStates.push(name);
    });
    game.events.on("afterActions", () => {
      if (game.getStateName() == "Night" && !game._snap) {
        game._snap = {};
        for (let player of game.players) {
          game._snap[player.id] = {
            alive: player.alive,
            role: player.role && player.role.name,
          };
        }
        // Freeze after the night resolves so Day votes cannot loop the game.
        game.createNextStateTimer = function () {};
      }
    });
    if (onStart) onStart(game);
  });

  for (let user of users) await game.userJoin(user);
  return game;
}

function byRole(game, name, modifier) {
  return game.players.filter((player) => {
    if (!player.role || player.role.name != name) return false;
    if (modifier == null) return true;
    return player.role.modifier == modifier;
  });
}

function bindVotes(game, decide) {
  const bySocket = new Map();
  const voted = new Set();
  for (let player of game.players) bySocket.set(player.user.socket, player);

  for (let player of game.players) {
    player.user.socket.onClientEvent("meeting", function (meeting) {
      const voter = bySocket.get(this);
      if (!meeting.voting || !voter || game.finished || game._snap) return;
      const voteKey = voter.id + ":" + meeting.id;
      if (voted.has(voteKey)) return;
      const selection = decide(voter, meeting, game);
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
  if (targets.indexOf("None") != -1) return "None";
  if (targets.indexOf("*") != -1) return "*";
  return targets.length ? targets[0] : null;
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
          reject(new Error("timed out waiting for night"));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 15);
  });
}

function alertTexts(game) {
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

function alertsFor(game, player) {
  const texts = [];
  const states = game.history && game.history.states;
  if (!states) return texts;
  for (let state of Object.values(states)) {
    for (let alert of state.alerts || []) {
      if (!alert || !alert.content) continue;
      const recipients = alert.recipients || [];
      if (recipients.some((recipient) => recipient && recipient.id == player.id)) {
        texts.push(String(alert.content));
      }
    }
  }
  return texts;
}

async function runNight(setup, decide, onStart) {
  const game = await makeGame(setup, onStart);
  bindVotes(game, decide);
  await waitFor(() => game._snap || game.finished);
  if (!game._snap) {
    const roles = game.players
      .map((player) => (player.role ? player.role.name : "none"))
      .join(",");
    throw new Error(
      "no night snapshot finished=" +
        game.finished +
        " states=" +
        (game.enteredStates || []).join(">") +
        " roles=" +
        roles
    );
  }
  return game;
}

function snap(game, player) {
  return game._snap[player.id];
}

function phaseLasted(game, name) {
  const row = (game.phaseTimes || []).find((item) => item.name == name);
  return row ? row.ms : 0;
}

describe("BotC conversion night", function () {
  this.timeout(20000);

  before(async function () {
    await db.promise;
  });

  beforeEach(async function () {
    await redis.client.flushdbAsync();
    Random.seed(1);
  });

  afterEach(function () {
    Random.seed(null);
  });

  describe("Imp star-pass", function () {
    it("does nothing on a real Sabbath night", async function () {
      const game = await runNight(
        {
          total: 5,
          EventsPerNight: 1,
          roles: [{ Imp: 1, Cultist: 1, Villager: 3, Sabbath: 1 }],
        },
        (player, meeting) => {
          if (player.role.name == "Imp" && meeting.name == "Kill") {
            return choose(meeting, player.id);
          }
          return choose(meeting);
        }
      );

      const imp = byRole(game, "Imp");
      imp.should.have.lengthOf(1);
      snap(game, imp[0]).alive.should.equal(true);
      snap(game, byRole(game, "Cultist")[0]).role.should.equal("Cultist");
      game.enteredStates.should.not.include("Night (Becoming)");
    });

    it("does nothing when a Doctor saves the Imp", async function () {
      const game = await runNight(
        {
          total: 5,
          roles: [{ Imp: 1, Cultist: 1, Doctor: 1, Villager: 2 }],
        },
        (player, meeting, current) => {
          const imp = byRole(current, "Imp")[0];
          if (player.role.name == "Doctor" && meeting.name == "Save") {
            return choose(meeting, imp.id);
          }
          if (player.role.name == "Imp" && meeting.name == "Kill") {
            return choose(meeting, player.id);
          }
          return choose(meeting);
        }
      );

      const imp = byRole(game, "Imp");
      imp.should.have.lengthOf(1);
      snap(game, imp[0]).alive.should.equal(true);
      snap(game, byRole(game, "Cultist")[0]).role.should.equal("Cultist");
    });

    it("does nothing when the Imp is kill immune", async function () {
      let imp;
      const game = await runNight(
        {
          total: 5,
          roles: [{ Imp: 1, Cultist: 1, Villager: 3 }],
        },
        (player, meeting) => {
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, player.id);
          }
          return choose(meeting);
        },
        (current) => {
          imp = byRole(current, "Imp")[0];
          imp.giveEffect("KillImmune");
        }
      );

      byRole(game, "Imp").should.have.lengthOf(1);
      snap(game, imp).alive.should.equal(true);
      snap(game, imp).role.should.equal("Imp");
      snap(game, byRole(game, "Cultist")[0]).role.should.equal("Cultist");
    });

    it("passes the Imp to the Cultist and not the Braggart", async function () {
      let cultist, braggart, imp;
      const game = await runNight(
        {
          total: 5,
          roles: [{ Imp: 1, Cultist: 1, Braggart: 1, Villager: 2 }],
        },
        (player, meeting) => {
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, player.id);
          }
          return choose(meeting);
        },
        (current) => {
          cultist = byRole(current, "Cultist")[0];
          braggart = byRole(current, "Braggart")[0];
          imp = byRole(current, "Imp")[0];
        }
      );

      snap(game, imp).alive.should.equal(false);
      snap(game, imp).role.should.equal("Imp");
      snap(game, cultist).role.should.equal("Imp");
      snap(game, cultist).alive.should.equal(true);
      snap(game, braggart).role.should.equal("Braggart");
      game.players
        .filter(
          (player) => snap(game, player).role == "Imp" && snap(game, player).alive
        )
        .should.have.lengthOf(1);
    });
  });

  describe("Delirium and Sorrowful", function () {
    it("gives a false report when a delirious Sorrowful Cop dies", async function () {
      let cop;
      const game = await runNight(
        {
          total: 4,
          roles: [{ "Cop:Sorrowful": 1, Imp: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          const mafioso = byRole(current, "Mafioso")[0];
          const villager = byRole(current, "Villager")[0];
          if (meeting.name == "Investigate") return choose(meeting, mafioso.id);
          if (player.role.name == "Imp" && meeting.name == "Kill") {
            return choose(meeting, cop.id);
          }
          if (player.role.name == "Mafioso" && meeting.name == "Kill") {
            return choose(meeting, villager.id);
          }
          return choose(meeting);
        },
        (current) => {
          cop = byRole(current, "Cop")[0];
          cop.giveEffect("Delirious", cop, Infinity);
        }
      );

      snap(game, cop).alive.should.equal(false);
      const reports = alertsFor(game, cop).filter((text) =>
        text.includes("After investigating")
      );
      reports.should.have.lengthOf(1);
      reports[0].should.include("Innocent");
      alertTexts(game).join("\n").should.not.include("State thing");
    });

    it("gives no report when a delirious Sorrowful Cop survives", async function () {
      let cop;
      const game = await runNight(
        {
          total: 4,
          roles: [{ "Cop:Sorrowful": 1, Imp: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          const mafioso = byRole(current, "Mafioso")[0];
          const villager = byRole(current, "Villager")[0];
          if (meeting.name == "Investigate") return choose(meeting, mafioso.id);
          if (
            (player.role.name == "Imp" || player.role.name == "Mafioso") &&
            meeting.name == "Kill"
          ) {
            return choose(meeting, villager.id);
          }
          return choose(meeting);
        },
        (current) => {
          cop = byRole(current, "Cop")[0];
          cop.giveEffect("Delirious", cop, Infinity);
        }
      );

      snap(game, cop).alive.should.equal(true);
      alertsFor(game, cop)
        .filter((text) => text.includes("After investigating"))
        .should.have.lengthOf(0);
    });

    it("gives no report when a delirious Sorrowful Cop is roleblocked", async function () {
      let cop;
      const game = await runNight(
        {
          total: 5,
          roles: [{ "Cop:Sorrowful": 1, Drunk: 1, Imp: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          const mafioso = byRole(current, "Mafioso")[0];
          const villager = byRole(current, "Villager")[0];
          if (meeting.name == "Investigate") return choose(meeting, mafioso.id);
          if (meeting.name == "Block") return choose(meeting, cop.id);
          if (
            (player.role.name == "Imp" || player.role.name == "Mafioso") &&
            meeting.name == "Kill"
          ) {
            return choose(meeting, villager.id);
          }
          return choose(meeting);
        },
        (current) => {
          cop = byRole(current, "Cop")[0];
          cop.giveEffect("Delirious", cop, Infinity);
        }
      );

      alertsFor(game, cop)
        .filter((text) => text.includes("After investigating"))
        .should.have.lengthOf(0);
    });

    it("gives no report when a delirious Cop is roleblocked", async function () {
      let cop;
      const game = await runNight(
        {
          total: 5,
          roles: [{ Cop: 1, Drunk: 1, Imp: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          const mafioso = byRole(current, "Mafioso")[0];
          const villager = byRole(current, "Villager")[0];
          if (meeting.name == "Investigate") return choose(meeting, mafioso.id);
          if (meeting.name == "Block") return choose(meeting, cop.id);
          if (
            (player.role.name == "Imp" || player.role.name == "Mafioso") &&
            meeting.name == "Kill"
          ) {
            return choose(meeting, villager.id);
          }
          return choose(meeting);
        },
        (current) => {
          cop = byRole(current, "Cop")[0];
          cop.giveEffect("Delirious", cop, Infinity);
        }
      );

      alertsFor(game, cop)
        .filter((text) => text.includes("After investigating"))
        .should.have.lengthOf(0);
    });

    it("gives a false report from a delirious Cop", async function () {
      let cop;
      const game = await runNight(
        {
          total: 4,
          roles: [{ Cop: 1, Imp: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          const mafioso = byRole(current, "Mafioso")[0];
          const villager = byRole(current, "Villager")[0];
          if (meeting.name == "Investigate") return choose(meeting, mafioso.id);
          if (
            (player.role.name == "Imp" || player.role.name == "Mafioso") &&
            meeting.name == "Kill"
          ) {
            return choose(meeting, villager.id);
          }
          return choose(meeting);
        },
        (current) => {
          cop = byRole(current, "Cop")[0];
          cop.giveEffect("Delirious", cop, Infinity);
        }
      );

      const reports = alertsFor(game, cop).filter((text) =>
        text.includes("After investigating")
      );
      reports.should.have.lengthOf(1);
      reports[0].should.include("Innocent");
    });

    it("gives a true report when a Sorrowful Cop is killed", async function () {
      let cop;
      const game = await runNight(
        {
          total: 4,
          roles: [{ "Cop:Sorrowful": 1, Imp: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          const mafioso = byRole(current, "Mafioso")[0];
          const villager = byRole(current, "Villager")[0];
          if (meeting.name == "Investigate") return choose(meeting, mafioso.id);
          if (player.role.name == "Imp" && meeting.name == "Kill") {
            return choose(meeting, cop.id);
          }
          if (player.role.name == "Mafioso" && meeting.name == "Kill") {
            return choose(meeting, villager.id);
          }
          return choose(meeting);
        },
        (current) => {
          cop = byRole(current, "Cop")[0];
        }
      );

      snap(game, cop).alive.should.equal(false);
      const reports = alertsFor(game, cop).filter((text) =>
        text.includes("After investigating")
      );
      reports.should.have.lengthOf(1);
      reports[0].should.include("Guilty");
      alertTexts(game).join("\n").should.not.include("State thing");
    });
  });

  describe("Mi-Go", function () {
    it("drops an unprotected old Demon's kill, and the new Demon still kills", async function () {
      let miGo, imp, villager, victim, bystander;
      const game = await runNight(
        {
          total: 5,
          roles: [
            {
              "Mi-Go": 1,
              Imp: 1,
              Villager: 2,
              Doctor: 1,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, victim.id);
          }
          if (meeting.name == "Kill and Delirate") {
            return choose(meeting, bystander.id);
          }
          if (player.role.name == "Doctor" && meeting.name == "Save") {
            return choose(meeting, miGo.id);
          }
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          imp = byRole(current, "Imp")[0];
          const villagers = byRole(current, "Villager");
          villager = villagers[0];
          victim = villagers[1];
          bystander = byRole(current, "Doctor")[0];
        }
      );

      snap(game, villager).role.should.equal("Lamia");
      snap(game, villager).alive.should.equal(true);
      snap(game, imp).alive.should.equal(false);
      snap(game, victim).alive.should.equal(true);
      snap(game, bystander).alive.should.equal(false);
    });

    it("checks protection after savers and before kills", async function () {
      let miGo, imp, villager, victim;
      const game = await runNight(
        {
          total: 5,
          roles: [
            {
              "Mi-Go": 1,
              Imp: 1,
              Villager: 2,
              Doctor: 1,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, victim.id);
          }
          if (meeting.name == "Kill and Delirate") {
            return choose(meeting, miGo.id);
          }
          if (player.role.name == "Doctor" && meeting.name == "Save") {
            return choose(meeting, imp.id);
          }
          return choose(meeting);
        },
        (current) => {
          current.nightOrderTrace = [];
          current.events.on("state", () => {
            if (current.getStateName() != "Night") return;
            current.queueAction(
              new Action({
                game: current,
                priority: PRIORITY_NIGHT_SAVER,
                labels: ["absolute", "hidden"],
                run: function () {
                  current.nightOrderTrace.push("saver");
                },
              })
            );
            current.queueAction(
              new Action({
                game: current,
                priority: PRIORITY_KILL_DEFAULT,
                labels: ["absolute", "hidden"],
                run: function () {
                  current.nightOrderTrace.push("kill");
                },
              })
            );
          });
          miGo = byRole(current, "Mi-Go")[0];
          imp = byRole(current, "Imp")[0];
          villager = byRole(current, "Villager")[0];
          victim = byRole(current, "Doctor")[0];
        }
      );

      game.nightOrderTrace.should.eql(["saver", "migo-check", "kill"]);
      snap(game, imp).alive.should.equal(true);
      snap(game, victim).alive.should.equal(true);
      snap(game, villager).alive.should.equal(false);
      snap(game, villager).role.should.equal("Lamia");
    });

    it("kills the unprotected Demon when the other old Demon is saved", async function () {
      let miGo, imp, jiangshi, villager, impVictim, jiangshiVictim, doctor;
      const game = await runNight(
        {
          total: 9,
          roles: [
            {
              "Mi-Go": 1,
              Imp: 1,
              Jiangshi: 1,
              Villager: 4,
              Doctor: 1,
              Cultist: 1,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, impVictim.id);
          }
          if (player == jiangshi && meeting.name == "Kill") {
            return choose(meeting, jiangshiVictim.id);
          }
          if (meeting.name == "Kill and Delirate") {
            return choose(meeting, doctor.id);
          }
          if (player == doctor && meeting.name == "Save") {
            return choose(meeting, imp.id);
          }
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          imp = byRole(current, "Imp")[0];
          jiangshi = byRole(current, "Jiangshi")[0];
          doctor = byRole(current, "Doctor")[0];
          villager = byRole(current, "Cultist")[0];
          const villagers = byRole(current, "Villager");
          impVictim = villagers[0];
          jiangshiVictim = villagers[1];
        }
      );

      snap(game, imp).alive.should.equal(true);
      snap(game, jiangshi).alive.should.equal(false);
      snap(game, impVictim).alive.should.equal(false);
      snap(game, jiangshiVictim).alive.should.equal(true);
      snap(game, villager).role.should.equal("Lamia");
      snap(game, villager).alive.should.equal(true);
    });

    it("kills the new Demon and ignores the chosen kill when both old Demons are protected", async function () {
      let miGo, imp, jiangshi, villager, impVictim, jiangshiVictim;
      const game = await runNight(
        {
          total: 7,
          roles: [
            {
              "Mi-Go": 1,
              Imp: 1,
              Jiangshi: 1,
              Villager: 3,
              Doctor: 1,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, impVictim.id);
          }
          if (player == jiangshi && meeting.name == "Kill") {
            return choose(meeting, jiangshiVictim.id);
          }
          if (meeting.name == "Kill and Delirate") {
            return choose(meeting, miGo.id);
          }
          if (player.role.name == "Doctor" && meeting.name == "Save") {
            return choose(meeting, imp.id);
          }
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          imp = byRole(current, "Imp")[0];
          jiangshi = byRole(current, "Jiangshi")[0];
          villager = byRole(current, "Doctor")[0];
          const villagers = byRole(current, "Villager");
          impVictim = villagers[0];
          jiangshiVictim = villagers[1];
          imp.giveEffect("KillImmune");
          jiangshi.giveEffect("KillImmune");
        }
      );

      snap(game, imp).alive.should.equal(true);
      snap(game, jiangshi).alive.should.equal(true);
      snap(game, villager).alive.should.equal(false);
      snap(game, villager).role.should.equal("Lamia");
      const impDead = !snap(game, impVictim).alive;
      const jiangshiDead = !snap(game, jiangshiVictim).alive;
      (impDead !== jiangshiDead).should.equal(true);
    });

    it("kills the new Demon instead of a single protected old Demon", async function () {
      let miGo, imp, villager, victim;
      const game = await runNight(
        {
          total: 5,
          roles: [
            {
              "Mi-Go": 1,
              Imp: 1,
              Villager: 2,
              Doctor: 1,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, victim.id);
          }
          if (meeting.name == "Kill and Delirate") {
            return choose(meeting, miGo.id);
          }
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          imp = byRole(current, "Imp")[0];
          villager = byRole(current, "Villager")[0];
          victim = byRole(current, "Doctor")[0];
          imp.giveEffect("KillImmune");
        }
      );

      snap(game, imp).alive.should.equal(true);
      snap(game, victim).alive.should.equal(true);
      snap(game, villager).alive.should.equal(false);
    });

    it("does not let a Demon converted into another Demon kill that night", async function () {
      let miGo, imp, spare, newVictim;
      const game = await runNight(
        {
          total: 5,
          roles: [
            {
              "Mi-Go": 1,
              Imp: 1,
              Villager: 3,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, imp.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (meeting.name == "Kill") {
            return choose(meeting, spare.id);
          }
          if (meeting.name == "Kill and Delirate") {
            return choose(meeting, newVictim.id);
          }
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          imp = byRole(current, "Imp")[0];
          const villagers = byRole(current, "Villager");
          spare = villagers[0];
          newVictim = villagers[1];
        }
      );

      snap(game, imp).role.should.equal("Lamia");
      snap(game, imp).alive.should.equal(true);
      snap(game, spare).alive.should.equal(true);
      snap(game, newVictim).alive.should.equal(true);
      snap(game, miGo).alive.should.equal(true);
    });

    it("changes nothing when the role is already in play", async function () {
      let miGo, imp, villager, victim;
      const game = await runNight(
        {
          total: 5,
          roles: [{ "Mi-Go": 1, Imp: 1, Villager: 3 }],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Imp");
          }
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, victim.id);
          }
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          imp = byRole(current, "Imp")[0];
          const villagers = byRole(current, "Villager");
          villager = villagers[0];
          victim = villagers[1];
        }
      );

      snap(game, villager).role.should.equal("Villager");
      snap(game, imp).alive.should.equal(true);
      snap(game, imp).role.should.equal("Imp");
      snap(game, victim).alive.should.equal(false);
    });

    it("changes nothing when Mi-Go is roleblocked", async function () {
      let miGo, imp, villager, victim, drunk;
      const game = await runNight(
        {
          total: 5,
          roles: [
            {
              "Mi-Go": 1,
              Drunk: 1,
              Imp: 1,
              Villager: 2,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (player == drunk && meeting.name == "Block") {
            return choose(meeting, miGo.id);
          }
          if (player == imp && meeting.name == "Kill") {
            return choose(meeting, victim.id);
          }
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          drunk = byRole(current, "Drunk")[0];
          imp = byRole(current, "Imp")[0];
          const villagers = byRole(current, "Villager");
          villager = villagers[0];
          victim = villagers[1];
        }
      );

      snap(game, villager).role.should.equal("Villager");
      snap(game, imp).alive.should.equal(true);
      snap(game, victim).alive.should.equal(false);
    });
  });

  describe("night phases", function () {
    it("lets a Philosopher investigate as Cop the same night", async function () {
      let philosopher, cop, mafioso;
      const game = await runNight(
        {
          total: 4,
          roles: [{ Philosopher: 1, Cop: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          if (player == philosopher && meeting.name == "Become Role") {
            return choose(meeting, "Cop");
          }
          if (meeting.name == "Investigate") {
            return choose(meeting, mafioso.id);
          }
          if (player.role.name == "Mafioso" && meeting.name == "Kill") {
            const villager = byRole(current, "Villager")[0];
            return choose(meeting, villager.id);
          }
          return choose(meeting);
        },
        (current) => {
          philosopher = byRole(current, "Philosopher")[0];
          cop = byRole(current, "Cop")[0];
          mafioso = byRole(current, "Mafioso")[0];
        }
      );

      snap(game, philosopher).role.should.equal("Cop");
      game.enteredStates.should.include("Night (Becoming)");
      game.enteredStates.should.not.include("Night (Swapping)");
      game.enteredStates.should.not.include("Night (Converting)");
      phaseLasted(game, "Night (Becoming)").should.be.at.least(
        CONVERSION_TEST_MS - 80
      );
      const reports = alertsFor(game, philosopher).filter((text) =>
        text.includes("After investigating")
      );
      reports.should.have.lengthOf(1);
      reports[0].should.include("Guilty");
      cop.hasEffect("Delirious").should.equal(true);
    });

    it("lets a Snake Charmer kill as the Demon the same night", async function () {
      let charmer, imp, villager;
      const game = await runNight(
        {
          total: 3,
          roles: [{ "Snake Charmer": 1, Imp: 1, Villager: 1 }],
        },
        (player, meeting) => {
          if (player == charmer && meeting.name == "Swap Roles") {
            return choose(meeting, imp.id);
          }
          if (meeting.name == "Kill") return choose(meeting, villager.id);
          return choose(meeting);
        },
        (current) => {
          charmer = byRole(current, "Snake Charmer")[0];
          imp = byRole(current, "Imp")[0];
          villager = byRole(current, "Villager")[0];
        }
      );

      game.enteredStates.should.include("Night (Swapping)");
      game.enteredStates.should.not.include("Night (Becoming)");
      game.enteredStates.should.not.include("Night (Converting)");
      snap(game, charmer).role.should.equal("Imp");
      snap(game, charmer).alive.should.equal(true);
      snap(game, imp).role.should.equal("Snake Charmer");
      snap(game, imp).alive.should.equal(true);
      snap(game, villager).alive.should.equal(false);
    });

    it("opens only the Mi-Go phase when Mi-Go is the conversion role", async function () {
      const game = await runNight(
        {
          total: 5,
          roles: [{ "Mi-Go": 1, Imp: 1, Villager: 3 }],
        },
        (player, meeting, current) => {
          if (meeting.name == "Convert To") return choose(meeting, "None");
          if (meeting.name == "Kill") {
            const villager = byRole(current, "Villager")[0];
            return choose(meeting, villager.id);
          }
          return choose(meeting);
        }
      );

      game.enteredStates.should.include("Night (Converting)");
      game.enteredStates.should.not.include("Night (Becoming)");
      game.enteredStates.should.not.include("Night (Swapping)");
    });

    it("keeps a game with no conversion roles on the normal night flow", async function () {
      const game = await runNight(
        {
          total: 4,
          roles: [{ Cop: 1, Doctor: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          const mafioso = byRole(current, "Mafioso")[0];
          if (meeting.name == "Investigate" || meeting.name == "Save") {
            return choose(meeting, mafioso.id);
          }
          return choose(meeting);
        }
      );

      game.enteredStates.should.include("Night");
      game.enteredStates.should.include("Day");
      game.enteredStates.join(" ").should.not.include("Becoming");
      game.enteredStates.join(" ").should.not.include("Swapping");
      game.enteredStates.join(" ").should.not.include("Converting");
    });

    it("roleblocks a Snake Charmer from an earlier phase", async function () {
      let charmer, imp, drunk;
      const game = await runNight(
        {
          total: 5,
          roles: [
            {
              Philosopher: 1,
              "Snake Charmer": 1,
              Drunk: 1,
              Imp: 1,
              Villager: 1,
            },
          ],
        },
        (player, meeting) => {
          if (meeting.name == "Become Role") return choose(meeting, "None");
          if (player == drunk && meeting.name == "Block") {
            return choose(meeting, charmer.id);
          }
          if (player == charmer && meeting.name == "Swap Roles") {
            return choose(meeting, imp.id);
          }
          if (meeting.name == "Kill") return choose(meeting, drunk.id);
          return choose(meeting);
        },
        (current) => {
          charmer = byRole(current, "Snake Charmer")[0];
          imp = byRole(current, "Imp")[0];
          drunk = byRole(current, "Drunk")[0];
        }
      );

      game.enteredStates.should.include("Night (Becoming)");
      game.enteredStates.should.include("Night (Swapping)");
      snap(game, charmer).role.should.equal("Snake Charmer");
      snap(game, imp).role.should.equal("Imp");
    });

    it("keeps Shrink immunity through to the Mi-Go phase", async function () {
      let miGo, villager, shrink;
      const game = await runNight(
        {
          total: 5,
          roles: [
            {
              Philosopher: 1,
              Shrink: 1,
              "Mi-Go": 1,
              Villager: 1,
              Imp: 1,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (meeting.name == "Become Role") return choose(meeting, "None");
          if (player == shrink && meeting.name == "Psychoanalyze") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (meeting.name == "Kill") return choose(meeting, shrink.id);
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          villager = byRole(current, "Villager")[0];
          shrink = byRole(current, "Shrink")[0];
        }
      );

      snap(game, villager).role.should.equal("Villager");
    });

    it("does not convert a player with convert immunity", async function () {
      let miGo, villager;
      const game = await runNight(
        {
          total: 5,
          roles: [
            {
              "Mi-Go": 1,
              Villager: 2,
              Imp: 1,
              Doctor: 1,
              "Lamia:Banished": 1,
            },
          ],
        },
        (player, meeting) => {
          if (player == miGo && meeting.name == "Select Player") {
            return choose(meeting, villager.id);
          }
          if (player == miGo && meeting.name == "Convert To") {
            return choose(meeting, "Lamia:Banished");
          }
          if (meeting.name == "Kill") return choose(meeting, miGo.id);
          if (meeting.name == "Save") return choose(meeting, villager.id);
          return choose(meeting);
        },
        (current) => {
          miGo = byRole(current, "Mi-Go")[0];
          villager = byRole(current, "Villager")[0];
          villager.giveEffect("ConvertImmune", 1, Infinity);
        }
      );

      snap(game, villager).role.should.equal("Villager");
      snap(game, villager).alive.should.equal(true);
    });

    it("runs conversion phases when those roles are in the setup but not in play", async function () {
      const game = await runNight(
        {
          total: 3,
          roles: [
            {
              "Philosopher:Banished": 1,
              "Snake Charmer:Banished": 1,
              "Mi-Go:Banished": 1,
              Villager: 2,
              Imp: 1,
            },
          ],
        },
        (player, meeting, current) => {
          if (meeting.name == "Kill") {
            const villager = byRole(current, "Villager")[0];
            return choose(meeting, villager && villager.id);
          }
          return choose(meeting);
        }
      );

      for (let player of game.players) {
        player.role.name.should.not.equal("Philosopher");
        player.role.name.should.not.equal("Snake Charmer");
        player.role.name.should.not.equal("Mi-Go");
      }
      game.enteredStates.should.include("Night (Becoming)");
      game.enteredStates.should.include("Night (Swapping)");
      game.enteredStates.should.include("Night (Converting)");
      phaseLasted(game, "Night (Becoming)").should.be.at.least(
        CONVERSION_TEST_MS - 80
      );
      phaseLasted(game, "Night (Swapping)").should.be.at.least(
        CONVERSION_TEST_MS - 80
      );
      phaseLasted(game, "Night (Converting)").should.be.at.least(
        CONVERSION_TEST_MS - 80
      );
    });

    it("skips a conversion action on timeout without a veg or kick", async function () {
      let philosopher;
      const game = await runNight(
        {
          total: 4,
          roles: [{ Philosopher: 1, Cop: 1, Mafioso: 1, Villager: 1 }],
        },
        (player, meeting, current) => {
          if (meeting.name == "Become Role") return null;
          if (meeting.name == "Kill") {
            const villager = byRole(current, "Villager")[0];
            return choose(meeting, villager && villager.id);
          }
          return choose(meeting);
        },
        (current) => {
          philosopher = byRole(current, "Philosopher")[0];
          // Live games veg-kick when the clock expires. Conversion phases must not.
          current.isTest = false;
          current.kickAttempted = false;
          current.checkVeg = function () {
            if (current.isConversionNightPhase(current.getStateName())) {
              current.kickAttempted = true;
            }
            current.gotoNextState();
          };
        }
      );

      snap(game, philosopher).role.should.equal("Philosopher");
      snap(game, philosopher).alive.should.equal(true);
      philosopher.exorcised.should.equal(false);
      game.hadVegKill.should.equal(false);
      game.kickAttempted.should.equal(false);
      phaseLasted(game, "Night (Becoming)").should.be.at.least(
        CONVERSION_TEST_MS - 80
      );
      alertTexts(game).join("\n").should.not.include("kicked if you fail");
    });
  });
});
