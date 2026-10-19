const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should();
const db = require("../../db/db");
const redis = require("../../modules/redis");
const shortid = require("shortid");
const Game = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;

function makeUser(ownsTextEffects) {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    itemsOwned: { textEffects: ownsTextEffects ? 1 : 0 },
    isTest: true,
  });
}

async function makeGame(setup, users) {
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setup,
      stateLengths: { Day: 60000, Night: 60000 },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });
  await game.init();
  for (let user of users) await game.userJoin(user);
  return game;
}

function speak(user, meetingId, content, extra = {}) {
  user.socket.sendToServer("speak", {
    content,
    meetingId,
    abilityName: null,
    abilityTarget: null,
    ...extra,
  });
}

function heard(user) {
  return user.socket.clientMessages
    .filter((m) => m.eventName == "message" && m.data && m.data.senderId != "server")
    .map((m) => m.data);
}

function alerts(user) {
  return user.socket.clientMessages
    .filter((m) => m.eventName == "message" && m.data && m.data.senderId == "server")
    .map((m) => m.data.content);
}

const setup = {
  total: 7,
  roles: [{ Sheriff: 1, Villager: 4, Godfather: 2 }],
  gameSettings: { "Day Start": true },
};

describe("Games/Text effects", function () {
  this.timeout(10000);

  beforeEach(async function () {
    await db.promise;
    await redis.client.flushdbAsync();
  });

  it("pregame: an owner's /wave reaches everyone as plain text with the effect", async function () {
    const owner = makeUser(true);
    const other = makeUser(false);
    const game = await makeGame(setup, [owner, other]);
    try {
      (!!game.started).should.equal(false);
      speak(owner, game.pregame.id, "/wave hello everyone");

      const got = heard(other).filter((m) => m.content == "hello everyone");
      got.should.have.lengthOf(1);
      got[0].content.should.equal("hello everyone");
      got[0].textEffect.should.equal("wave");

      // The meeting log (what reviews and the archive use) keeps plain text.
      const logged = game.pregame.messages.map((m) => m.content);
      logged.should.include("hello everyone");
      logged.join(" ").should.not.include("/wave");
    } finally {
      game.clearTimers();
    }
  });

  it("pregame: a non-owner gets a notice and nothing is sent", async function () {
    const owner = makeUser(true);
    const other = makeUser(false);
    const game = await makeGame(setup, [owner, other]);
    try {
      speak(other, game.pregame.id, "/shake hi");
      heard(owner).filter((m) => /hi/.test(m.content)).should.have.lengthOf(0);
      alerts(other).join("\n").should.include("/shake requires the Advanced Text Effects shop item");

      // A client cannot attach an effect to an ordinary message.
      speak(other, game.pregame.id, "just chatting", { textEffect: "wave" });
      const plain = heard(owner).filter((m) => m.content == "just chatting");
      plain.should.have.lengthOf(1);
      should.not.exist(plain[0].textEffect);
    } finally {
      game.clearTimers();
    }
  });

  it("an owner's bare /wave only gets a hint", async function () {
    const owner = makeUser(true);
    const other = makeUser(false);
    const game = await makeGame(setup, [owner, other]);
    try {
      const before = heard(other).length;
      speak(owner, game.pregame.id, "/wave");
      heard(other).length.should.equal(before);
      alerts(owner).join("\n").should.include("Type a message after /wave");
    } finally {
      game.clearTimers();
    }
  });

  it("day chat: the village hears the effect; the review copy is plain text", async function () {
    const users = [makeUser(true)];
    for (let i = 1; i < setup.total; i++) users.push(makeUser(false));
    const game = await makeGame(setup, users);
    try {
      game.started.should.equal(true);
      const village = game.players
        .array()[0]
        .getMeetings()
        .find((m) => m.name == "Village");
      should.exist(village);

      const listener = users[3];
      speak(users[0], village.id, "/rainbow good morning");
      const day = heard(listener).filter((m) => m.content == "good morning");
      day.should.have.lengthOf(1);
      day[0].textEffect.should.equal("rainbow");
      day[0].meetingId.should.equal(village.id);

      // Game review/archive serialisation: plain content, same effect field.
      const msg = village.messages.find((m) => m.content == "good morning");
      should.exist(msg);
      const review = msg.getMessageInfo();
      review.content.should.equal("good morning");
    } finally {
      game.clearTimers();
    }
  });
});
