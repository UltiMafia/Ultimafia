const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const db = require("../../db/db");
const redis = require("../../modules/redis");
const shortid = require("shortid");
const Game = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;
const constants = require("../../data/constants");

// Far enough apart that msgSpamSumLimit does not trip, still inside the
// similar-content quick window so a started game would block the variant.
const SPEAK_GAP_MS = 500;

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

async function makeGame(setup, stateLength, joined) {
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

  const count = joined == null ? users.length : joined;

  for (let i = 0; i < count; i++) await game.userJoin(users[i]);

  return { game, users };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function speak(user, meetingId, content) {
  user.socket.sendToServer("speak", {
    content: content,
    meetingId: meetingId,
    abilityName: null,
    abilityTarget: null,
  });
}

function countDelivered(user, content) {
  var count = 0;

  for (let message of user.socket.clientMessages) {
    if (
      message.eventName == "message" &&
      message.data &&
      message.data.content == content &&
      message.data.senderId != "server"
    )
      count++;
  }

  return count;
}

function speakCooldowns(user) {
  return user.socket.clientMessages.filter(
    (message) => message.eventName == "speakCooldown"
  );
}

describe("Games/PregameSpam", function () {
  this.timeout(20000);

  const line = "I checked Bob last night he is mafia please vote";
  const variant = line + " today";

  it("delivers repeated and near-duplicate lines in pregame", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const setup = { total: 3, roles: [{ Villager: 2, Mafioso: 1 }] };
    const { game, users } = await makeGame(setup, 0, 1);
    const user = users[0];

    try {
      should.not.exist(game.started);

      await speak(user, game.pregame.id, line);
      await sleep(SPEAK_GAP_MS);
      await speak(user, game.pregame.id, line);
      await sleep(SPEAK_GAP_MS);
      await speak(user, game.pregame.id, line);
      await sleep(SPEAK_GAP_MS);
      speak(user, game.pregame.id, variant);

      countDelivered(user, line).should.equal(3);
      countDelivered(user, variant).should.equal(1);
      speakCooldowns(user).should.have.lengthOf(0);
      should.not.exist(game.started);
    } finally {
      game.clearTimers();
    }
  });

  it("still rate-limits a pregame flood", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const setup = { total: 3, roles: [{ Villager: 2, Mafioso: 1 }] };
    const { game, users } = await makeGame(setup, 0, 1);
    const user = users[0];
    const flood = "pregame flood line";

    try {
      should.not.exist(game.started);

      // Second identical line is allowed by the duplicate check, so a drop
      // here is the rate limit.
      speak(user, game.pregame.id, flood);
      speak(user, game.pregame.id, flood);

      countDelivered(user, flood).should.equal(1);
      speakCooldowns(user).should.have.lengthOf(1);
      should.exist(speakCooldowns(user)[0].data.cooldownMs);
    } finally {
      game.clearTimers();
    }
  });

  it("blocks the third identical line after the game starts", async function () {
    await db.promise;
    await redis.client.flushdbAsync();

    const setup = {
      total: 3,
      roles: [{ Villager: 2, Mafioso: 1 }],
      gameSettings: { "Day Start": true },
    };
    const { game, users } = await makeGame(setup, 60000, 1);
    const user = users[0];

    try {
      should.not.exist(game.started);

      await game.userJoin(users[1]);
      should.not.exist(game.started);

      await game.userJoin(users[2]);
      game.started.should.equal(true);
      game.getStateName().should.equal("Day");

      const village = game.getMeetingByName("Village");
      should.exist(village);

      await speak(user, village.id, line);
      await sleep(SPEAK_GAP_MS);
      await speak(user, village.id, line);
      await sleep(SPEAK_GAP_MS);
      speak(user, village.id, line);

      countDelivered(user, line).should.equal(2);

      const cooldowns = speakCooldowns(user);
      cooldowns.should.have.lengthOf(1);
      cooldowns[0].data.cooldownMs.should.equal(
        constants.msgDuplicateCooldownMs
      );
      cooldowns[0].data.meetingId.should.equal(village.id);
    } finally {
      game.clearTimers();
    }
  });
});
