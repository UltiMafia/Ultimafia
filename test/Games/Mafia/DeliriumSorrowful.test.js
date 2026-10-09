const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
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

function addListenerToPlayer(player, eventName, action) {
  player.user.socket.onClientEvent(eventName, action);
}

function addListenerToPlayers(players, eventName, action) {
  for (let player of players) addListenerToPlayer(player, eventName, action);
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
            return;
          }
        });
      }
    });

  return hasAlert;
}

function waitForResult(check, timeoutMs, onTimeout) {
  return new Promise((resolve, reject) => {
    var start = Date.now();
    var interval = setInterval(() => {
      try {
        if (check()) {
          clearInterval(interval);
          resolve();
        } else if (timeoutMs && Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error(onTimeout ? onTimeout() : "timed out"));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, 100);
  });
}

function countNights(game) {
  return Object.values(game.history.states).filter(
    (s) => s.name && String(s.name).match(/Night/)
  ).length;
}

function alertContents(game) {
  return Object.values(game.history.states)
    .flatMap((s) => s.alerts)
    .map((alert) => alert.content)
    .filter((content) => content);
}

function hasCopReport(game, alignment, targetName) {
  return alertContents(game).some(
    (content) =>
      content.includes("After investigating") &&
      content.includes(`is ${alignment}`) &&
      content.includes(targetName)
  );
}

function castVote(socket, meeting, selection) {
  if (!meeting.voting || !meeting.targets) return;

  if (meeting.targets.indexOf(selection) == -1) {
    if (meeting.targets.indexOf("Yes") != -1) selection = "Yes";
    else if (meeting.targets.indexOf("*") != -1) selection = "*";
    else return;
  }

  socket.sendToServer("vote", {
    selection: selection,
    meetingId: meeting.id,
  });
}

// Sorrowful blocks secondary actions only while the actor is still alive.
// A night kill therefore lets the Cop report resolve.
async function runCopNight(options) {
  await db.promise;
  await redis.client.flushdbAsync();

  const copKey = options.sorrowful ? "Cop:Sorrowful" : "Cop";
  const setup = {
    total: 3,
    roles: [{ [copKey]: 1, Villager: 1, Mafioso: 1 }],
  };
  const game = await makeGame(setup, 3000);
  const roles = getRoles(game);
  const cop = roles["Cop"];
  const villager = roles["Villager"];
  const seen = [];
  const voted = new WeakMap();
  let applied = false;

  if (options.sorrowful) {
    cop.role.modifier.should.equal("Sorrowful");
  }

  addListenerToPlayers(game.players, "meeting", function (meeting) {
    let mine = voted.get(this);
    if (!mine) {
      mine = {};
      voted.set(this, mine);
    }
    if (mine[meeting.id]) return;
    mine[meeting.id] = true;
    seen.push(meeting.name);
    if (seen.length > 40) {
      throw new Error(
        `too many meetings states=${Object.values(game.history.states)
          .map((s) => s.name)
          .join(",")} meetings=${seen.join(",")}`
      );
    }
    if (options.stopAtSecondNight && countNights(game) >= 2) return;

    if (options.delirious && !applied) {
      cop.giveEffect("Delirious", cop, Infinity);
      applied = true;
    }

    if (meeting.name == "Investigate") {
      castVote(this, meeting, villager.id);
    } else if (meeting.name == "Mafia Kill") {
      castVote(this, meeting, options.killCop ? cop.id : "*");
    } else {
      castVote(this, meeting, "*");
    }
  });

  if (options.delirious) {
    cop.isDelirious().should.equal(true);
  }

  const dump = () =>
    `states=${Object.values(game.history.states)
      .map((s) => s.name)
      .join(",")} alerts=${alertContents(game).join(" || ")} meetings=${seen.join(
      ","
    )} alive=${cop.alive}`;

  await waitForResult(
    () => {
      if (options.waitForSecondNight) return countNights(game) >= 2;
      return (
        game.finished ||
        countNights(game) >= 2 ||
        alertContents(game).some((content) =>
          content.includes("After investigating")
        )
      );
    },
    12000,
    dump
  );

  return { game, cop, villager, dump };
}

describe("Games/Mafia/DeliriumSorrowful", function () {
  this.timeout(20000);

  it("gives a delirious Sorrowful Cop no report when they survive the night", async function () {
    const { game, cop, villager, dump } = await runCopNight({
      sorrowful: true,
      delirious: true,
      killCop: false,
      stopAtSecondNight: true,
      waitForSecondNight: true,
    });

    cop.alive.should.equal(true);
    expect(
      hasCopReport(game, "Guilty", villager.name),
      dump()
    ).to.equal(false);
    expect(
      hasCopReport(game, "Innocent", villager.name),
      dump()
    ).to.equal(false);
    expect(gameHasAlert(game, "After investigating"), dump()).to.equal(false);
  });

  it("still gives a delirious Cop a false report", async function () {
    const { game, villager, dump } = await runCopNight({
      sorrowful: false,
      delirious: true,
      killCop: false,
      stopAtSecondNight: true,
    });

    expect(hasCopReport(game, "Guilty", villager.name), dump()).to.equal(true);
    expect(hasCopReport(game, "Innocent", villager.name), dump()).to.equal(
      false
    );
  });

  it("still gives a Sorrowful Cop a true report when killed at night", async function () {
    const { game, cop, villager, dump } = await runCopNight({
      sorrowful: true,
      delirious: false,
      killCop: true,
      stopAtSecondNight: false,
    });

    cop.alive.should.equal(false);
    expect(hasCopReport(game, "Innocent", villager.name), dump()).to.equal(
      true
    );
    expect(hasCopReport(game, "Guilty", villager.name), dump()).to.equal(false);
  });

  it("sends no State thing alert during a night with a delirious player", async function () {
    const { game, dump } = await runCopNight({
      sorrowful: false,
      delirious: true,
      killCop: false,
      stopAtSecondNight: true,
      waitForSecondNight: true,
    });

    expect(countNights(game), dump()).to.be.at.least(2);
    expect(gameHasAlert(game, "State thing"), dump()).to.equal(false);
  });
});
