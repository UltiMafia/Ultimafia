const dotenv = require("dotenv").config();
const chai = require("chai");

const should = chai.should();
const shortid = require("shortid");
const db = require("../../db/db");
const redis = require("../../modules/redis");
const Game = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;

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
  const users = [];

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
      setup,
      stateLengths: {
        Day: stateLength,
        Night: stateLength,
      },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();

  for (const user of users) await game.userJoin(user);

  return game;
}

function getRoles(game) {
  const roles = {};

  for (const player of game.players) {
    const roleName = player.role.name;

    if (!roles[roleName]) roles[roleName] = player;
    else if (Array.isArray(roles[roleName])) roles[roleName].push(player);
    else {
      const existingPlayer = roles[roleName];
      roles[roleName] = [];
      roles[roleName].push(existingPlayer);
      roles[roleName].push(player);
    }
  }

  return roles;
}

function addListenerToPlayer(player, eventName, action) {
  player.user.socket.onClientEvent(eventName, action);
}

function addListenerToPlayers(players, eventName, action) {
  for (const player of players) addListenerToPlayer(player, eventName, action);
}

function addListenerToRoles(game, roleNames, eventName, action) {
  const players = game.players.filter(
    (p) => roleNames.indexOf(p.role.name) != -1
  );
  addListenerToPlayers(players, eventName, action);
}

function gameHasAlert(game, alertMsg, roleName) {
  let hasAlert = false;

  Object.values(game.history.states)
    .flatMap((s) => s.alerts)
    .forEach((alert) => {
      if (alert.content?.includes(alertMsg)) {
        if (roleName == undefined) {
          hasAlert = true;
          return;
        }

        alert.recipients.forEach((r) => {
          if (r.role.name === roleName) {
            hasAlert = true;
          }
        });
      }
    });

  return hasAlert;
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

function waitForGameEnd(game) {
  return waitForResult(() => game.finished);
}

describe("Games/Mafia", () => {
  describe("Villager and Mafioso", () => {
    it("should make the village win when the mafia is lynched", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Villager: 2, Mafioso: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Mafia);
      should.exist(game.winners.groups.Village);
      game.winners.groups.Village.should.have.lengthOf(2);
    });

    it("should make the mafia win when the mafia outnumbers the village", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Villager: 2, Mafioso: 1 }] };
      const game = await makeGame(setup);

      addListenerToRoles(game, ["Mafioso"], "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: meeting.targets[0],
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Village);
      should.exist(game.winners.groups.Mafia);
      game.winners.groups.Mafia.should.have.lengthOf(1);
    });

    it("should allow the game to continue after a death", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 4, roles: [{ Villager: 3, Mafioso: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: meeting.targets[0],
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Mafia);
      should.exist(game.winners.groups.Village);
      game.winners.groups.Village.should.have.lengthOf(3);
    });

    // with the addition of kicks #485, this will just wait for everyone to vote
    /*
        it("should still end with everyone AFK", async function () {
            await db.promise;
            await redis.client.flushdbAsync();

            const setup = { total: 3, roles: [{ "Villager": 2, "Mafioso": 1 }] };
            const game = await makeGame(setup);

            await waitForGameEnd(game);
        }); */
  });

  describe("Arms Dealer", () => {
    it("should make the village win when the mafia is shot", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, "Arms Dealer": 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Give Gun") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Shoot Gun") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Mafia);
      should.exist(game.winners.groups.Village);
      game.winners.groups.Village.should.have.lengthOf(2);
    });
  });

  describe("Chemist", () => {
    it("should kill a villager with poison and make the mafia win", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Villager: 2, Chemist: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Poison") {
          this.sendToServer("vote", {
            selection: roles.Villager[0].id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Mafia.should.have.lengthOf(1);
    });
  });

  describe("Fool", () => {
    it("should make only the Fool win when he is voted off", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Villager: 1, Fool: 1, Mafioso: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Fool.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Fool);
      should.not.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Fool.should.have.lengthOf(1);
    });
  });

  describe("Lycan", () => {
    it("should make the Monsters win when a werewolf kills someone", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Villager: 2, Lycan: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Wolf Bite") {
          this.sendToServer("vote", {
            selection: roles.Villager[0].id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Monsters);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Monsters.should.have.lengthOf(1);
    });

    it("should make the Lycan invincible during a full moon", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Lycan: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Wolf Bite") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Mafia" && game.stateEvents["Full Moon"]) {
          this.sendToServer("vote", {
            selection: roles.Lycan.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Monsters);
      should.not.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Monsters.should.have.lengthOf(1);
    });
  });

  describe("Bomb", () => {
    it("should make the mafia die when the bomb is killed", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Villager: 1, Bomb: 1, Mafioso: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Bomb.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });
  });

  describe("Doctor", () => {
    it("should save the villager from dying", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Doctor: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Save") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });
  });

  describe("Seeker and Inquisitor", () => {
    it("should make the Village win when the Inquisitor is guessed", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Seeker: 1, Inquisitor: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.actionName == "Guess Inquisitor") {
          this.sendToServer("vote", {
            selection: roles.Inquisitor.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });

    it("should make the Mafia win when the Seeker is guessed", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Seeker: 1, Inquisitor: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.actionName == "Guess Seeker") {
          this.sendToServer("vote", {
            selection: roles.Seeker.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Mafia.should.have.lengthOf(1);
    });
  });

  describe("Medic", () => {
    it("should save self from dying", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Medic: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Medic.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Save") {
          this.sendToServer("vote", {
            selection: roles.Medic.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });
  });

  describe("Escort", () => {
    it("should block the Mafia kill", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Escort: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Block") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });
  });

  describe("Serial Killer and Vigilante", () => {
    it("should make the Mafioso win when the Serial Killer and Vigilante kill each other", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Vigilante: 1, "Serial Killer": 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Solo Kill") {
          if (meeting.members[0].id == roles["Serial Killer"].id) {
            this.sendToServer("vote", {
              selection: roles.Vigilante.id,
              meetingId: meeting.id,
            });
          } else {
            this.sendToServer("vote", {
              selection: roles["Serial Killer"].id,
              meetingId: meeting.id,
            });
          }
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups["Serial Killer"]);
      game.winners.groups.Mafia.should.have.lengthOf(1);
    });
  });

  describe("Witch", () => {
    it("should redirect the mafia kill from the Witch to the Villager", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Witch: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Witch.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Control Actor") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Redirect to Target") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      should.exist(game.winners.groups.Monsters);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Mafia.should.have.lengthOf(1);
      game.winners.groups.Monsters.should.have.lengthOf(1);
    });
  });

  describe("Driver", () => {
    it("should drive the Mafia kill to the Mafioso", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Villager: 2, Driver: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Villager[0].id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Destination A") {
          this.sendToServer("vote", {
            selection: roles.Villager[0].id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Destination B") {
          this.sendToServer("vote", {
            selection: roles.Driver.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });
  });

  describe("Monkey", () => {
    it("should make the Monkey get blown up by the bomb", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Bomb: 1, Monkey: 1, Mafioso: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Bomb.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Steal Actions") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Mafia.should.have.lengthOf(1);
    });
  });

  describe("Bulletproof", () => {
    it("should prevent the Bulletproof from being killed by the Mafia", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Bulletproof: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Bulletproof.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });

    it("should kill the Bulletproof after two nights", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Bulletproof: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Bulletproof.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Mafia.should.have.lengthOf(1);
    });
  });

  describe("Blacksmith", () => {
    it("should prevent the person with armor from dying", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Blacksmith: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Give Armor") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });
  });

  describe("Granny", () => {
    it("should kill the Mafioso upon visit", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Granny: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Granny.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      roles.Granny.alive.should.be.true;
      game.winners.groups.Village.should.have.lengthOf(2);
    });

    it("should save the Mafioso from dying and lynch the Granny", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Doctor: 1, Granny: 1, Mafioso: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Granny.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Save") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Granny.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Mafia.should.have.lengthOf(1);
    });
  });

  describe("Hunter", () => {
    it("should kill the Mafioso when the Hunter is lynched", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Hunter: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Hunter.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Get Revenge") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      game.winners.groups.Village.should.have.lengthOf(2);
    });
  });

  describe("Survivor", () => {
    it("should win when alive among winning team", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Survivor: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Village);
      should.exist(game.winners.groups.Mafia);
      should.exist(game.winners.groups.Survivor);
      game.winners.groups.Survivor.should.have.lengthOf(1);
    });

    it("should win when last alive", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ "Serial Killer": 1, Survivor: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles["Serial Killer"].id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Solo Kill") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups["Serial Killer"]);
      should.not.exist(game.winners.groups.Mafia);
      should.exist(game.winners.groups.Survivor);
      game.winners.groups.Survivor.should.have.lengthOf(1);
    });

    it("should not win when dead", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Survivor: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Survivor.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Survivor);
      should.exist(game.winners.groups.Mafia);
    });
  });

  describe("Priest", () => {
    it("should kill the Lycan upon visiting the Priest", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Villager: 1, Priest: 1, Lycan: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Wolf Bite") {
          this.sendToServer("vote", {
            selection: roles.Priest.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Monsters);
      should.exist(game.winners.groups.Village);
    });
  });

  describe("Mason", () => {
    it("should win upon converting the Cthulhu", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Mason: 2, Cthulhu: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Masons") {
          this.sendToServer("vote", {
            selection: roles.Cthulhu.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Monsters);
      should.exist(game.winners.groups.Village);
    });

    it("should lose upon trying to convert the Mafioso", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Mason: 2, Mafioso: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Masons") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Village);
      should.exist(game.winners.groups.Mafia);
    });
  });

  describe("Cultist", () => {
    it("should kill all Cultists if the leader dies", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 5, roles: [{ Villager: 4, Cultist: 1 }] };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Cultists") {
          this.sendToServer("vote", {
            selection: roles.Villager[0].id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Cultist.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.not.exist(game.winners.groups.Monsters);
      should.exist(game.winners.groups.Village);
    });
  });

  describe("Jailer", () => {
    it("should jail and kill the Mafia", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Jailer: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Jail Target") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Jail") {
          this.sendToServer("vote", {
            selection: "Yes",
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
    });
  });

  describe("Alien", () => {
    it("should win when everyone is probed", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Alien: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Probe") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Alien);
      should.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Town);
      game.winners.players.should.have.lengthOf(2);
    });
  });

  describe("Associate", () => {
    it("should make the Mafia win when the Village is shot", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Hunter: 1, Associate: 1 }],
      };
      const game = await makeGame(setup);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Give Gun") {
          this.sendToServer("vote", {
            selection: roles.Hunter.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Shoot Gun") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups.Village);
      game.winners.groups.Mafia.should.have.lengthOf(1);
    });
  });

  describe("Loudmouth", () => {
    it("should shout visitors when LM is visited during the night", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Detective: 1, Mafioso: 1, Loudmouth: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Learn Role") {
          this.sendToServer("vote", {
            selection: roles.Loudmouth.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      gameHasAlert(game, "Curses!").should.be.true;
    });
  });

  describe("Lover", () => {
    it("If successful, both lover and target should receive notice", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Mafioso: 1, Lover: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name === "Fall in love") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      let targetHasMessage = false;
      let loverHasMessage = false;

      Object.values(game.history.states)
        .flatMap((m) => m.alerts)
        .forEach((alert) => {
          if (alert.content.includes("deathly")) {
            alert.recipients.forEach((r) => {
              if (r.role.name === "Villager") {
                targetHasMessage = true;
              } else if (r.role.name === "Lover") {
                loverHasMessage = true;
              }
            });
          }

          if (targetHasMessage && loverHasMessage) {
          }
        });

      (targetHasMessage && loverHasMessage).should.be.true;
    });
  });

  describe("Nomad", () => {
    it("should win with mafia when it follows mafia", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Mafioso: 1, Nomad: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Align With") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Mafia);
      game.winners.groups.Mafia.should.have.lengthOf(1);
      should.exist(game.winners.groups.Nomad);
      game.winners.groups.Nomad.should.have.lengthOf(1);
      should.not.exist(game.winners.groups.Village);
    });

    it("should win with village when it follows village", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Mafioso: 1, Nomad: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Align With") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Mafioso.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      game.winners.groups.Village.should.have.lengthOf(1);
      should.exist(game.winners.groups.Nomad);
      game.winners.groups.Nomad.should.have.lengthOf(1);
      should.not.exist(game.winners.groups.Mafia);
    });
  });

  describe("Caroler", () => {
    it("janitor should get carol when it does not visit", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Villager: 1, Caroler: 1, Janitor: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Sing Carol") {
          this.sendToServer("vote", {
            selection: roles.Janitor.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Clean Death") {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Janitor.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      gameHasAlert(
        game,
        "You see a merry Caroler outside your house!",
        "Janitor"
      ).should.be.true;
    });
  });

  describe("Bodyguard", () => {
    it("should kill all attackers and save the celebrity", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 4,
        roles: [{ Celebrity: 1, Mafioso: 1, "Serial Killer": 1, Bodyguard: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Celebrity.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Solo Kill") {
          this.sendToServer("vote", {
            selection: roles.Celebrity.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Night Bodyguard") {
          this.sendToServer("vote", {
            selection: roles.Celebrity.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      game.winners.groups.Village.should.have.lengthOf(2);
      roles.Bodyguard.alive.should.be.false;
      roles.Celebrity.alive.should.be.true;
      should.not.exist(game.winners.groups.Mafia);
      should.not.exist(game.winners.groups["Serial Killer"]);
    });
  });

  describe("Creepy Girl", () => {
    it("wins when doll holder does", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 4,
        roles: [
          { Villager: 1, Thief: 1, "Serial Killer": 1, "Creepy Girl": 1 },
        ],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Give Doll") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Steal From") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Solo Kill") {
          this.sendToServer("vote", {
            selection: roles.Thief.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups["Creepy Girl"]);
      game.winners.groups["Creepy Girl"].should.have.lengthOf(1);
      should.not.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
    });
  });

  describe("Surgeon", () => {
    it("prevents kill, kills attacker and prevents convert", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 4,
        roles: [{ Villager: 1, Surgeon: 1, "Serial Killer": 1, Mason: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Save") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Solo Kill") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Masons") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);

      should.not.exist(game.winners.groups["Serial Killer"]);
      should.exist(game.winners.groups.Village);
      should.exist(getRoles(game).Villager);
    });
  });

  describe("Comedian", () => {
    it("tells joke", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Comedian: 1, Bomb: 1, Cthulhu: 1 }] };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Tell Joke") {
          this.sendToServer("vote", {
            selection: roles.Bomb.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Comedian.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      gameHasAlert(game, "walk up to a bar", "Bomb").should.be.true;
    });
  });

  describe("Trapper", () => {
    it("kills mafia, cop will learn role", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 4,
        roles: [{ Villager: 1, Trapper: 1, Cop: 1, Mafioso: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Trap") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Learn Alignment") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: roles.Villager.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      should.exist(game.winners.groups.Village);
      should.not.exist(game.winners.groups.Mafia);
      gameHasAlert(game, "is the Trapper", "Cop").should.be.true;
    });
  });

  describe("Journalist", () => {
    it("can get cop report", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Cop: 1, Journalist: 1, Cthulhu: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Learn Alignment") {
          this.sendToServer("vote", {
            selection: roles.Cthulhu.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Receive Reports") {
          this.sendToServer("vote", {
            selection: roles.Cop.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Cthulhu.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      gameHasAlert(game, "is sided with the Monsters", "Journalist").should.be
        .true;
    });
  });

  describe("Psychic", () => {
    it("can get true alignment of godfather", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = {
        total: 3,
        roles: [{ Godfather: 1, Villager: 1, Psychic: 1 }],
      };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Read Mind") {
          this.sendToServer("vote", {
            selection: roles.Godfather.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Mafia") {
          this.sendToServer("vote", {
            selection: "*",
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Godfather.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      gameHasAlert(game, "sided with the Mafia", "Psychic").should.be.true;
    });

    it("no results when disturbed", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const setup = { total: 3, roles: [{ Cop: 1, Psychic: 1, Cthulhu: 1 }] };
      const game = await makeGame(setup, 3);
      const roles = getRoles(game);

      addListenerToPlayers(game.players, "meeting", function (meeting) {
        if (meeting.name == "Learn Alignment") {
          this.sendToServer("vote", {
            selection: roles.Psychic.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Read Mind") {
          this.sendToServer("vote", {
            selection: roles.Cthulhu.id,
            meetingId: meeting.id,
          });
        } else if (meeting.name == "Village") {
          this.sendToServer("vote", {
            selection: roles.Cthulhu.id,
            meetingId: meeting.id,
          });
        }
      });

      await waitForGameEnd(game);
      gameHasAlert(game, "was distracted", "Psychic").should.be.true;
    });
  });
});
