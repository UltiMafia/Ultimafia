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

function makeUser() {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    isTest: true,
  });
}

async function makePregame(joined) {
  const users = [];
  for (let i = 0; i < 3; i++) users.push(makeUser());

  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: { total: 3, roles: [{ Villager: 2, Mafioso: 1 }] },
      stateLengths: { Day: 0, Night: 0 },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });
  await game.init();
  for (let i = 0; i < joined; i++) await game.userJoin(users[i]);
  return { game, users };
}

function chatEvents(user) {
  return user.socket.clientMessages.filter(
    (m) =>
      (m.eventName == "message" || m.eventName == "quote") &&
      m.data &&
      m.data.senderId != "server"
  );
}

function findMessage(user, content) {
  const hit = user.socket.clientMessages.find(
    (m) => m.eventName == "message" && m.data && m.data.content == content
  );
  return hit && hit.data;
}

function quoteOf(original, toMeetingId) {
  return {
    messageId: original.id,
    toMeetingId,
    fromMeetingId: original.meetingId,
    fromState: "-1",
    messageContent: original.content,
  };
}

describe("Games/ChatReply", function () {
  this.timeout(20000);

  let game, users;

  beforeEach(async function () {
    await db.promise;
    await redis.client.flushdbAsync();
    ({ game, users } = await makePregame(2));
  });

  afterEach(function () {
    if (game) game.cancel && game.cancel();
  });

  it("posts the quote, then the reply text marked with the quote's id", async function () {
    const [alice, bob] = users;
    const meetingId = game.pregame.id;

    alice.socket.sendToServer("speak", { content: "I am the cop", meetingId });
    const original = findMessage(bob, "I am the cop");
    should.exist(original);

    alice.socket.flushMessages();
    bob.socket.flushMessages();

    bob.socket.sendToServer("reply", {
      quote: quoteOf(original, meetingId),
      message: { content: "prove it", meetingId },
    });

    for (const viewer of [alice, bob]) {
      const events = chatEvents(viewer);
      expect(events.map((e) => e.eventName)).to.deep.equal(["quote", "message"]);
      const [quote, reply] = events.map((e) => e.data);
      expect(quote.isQuote).to.equal(true);
      expect(quote.messageId).to.equal(original.id);
      expect(quote.toMeetingId).to.equal(meetingId);
      expect(reply.content).to.equal("prove it");
      expect(reply.replyTo).to.equal(quote.id);
      expect(reply.isQuote).to.not.equal(true);
    }

    // Stored server-side as a normal quote plus a normal message.
    const stored = game.pregame.messages.slice(-2);
    expect(stored[0].isQuote).to.equal(true);
    expect(stored[1].isQuote).to.not.equal(true);
    expect(stored[1].replyTo).to.equal(stored[0].id);
  });

  it("does not send the reply text when the quote is refused", async function () {
    const [alice, bob] = users;
    const meetingId = game.pregame.id;

    bob.socket.sendToServer("reply", {
      // Message ids outside 7-14 chars are refused by Meeting.quote.
      quote: { ...quoteOf({ id: "abc", meetingId, content: "x" }, meetingId) },
      message: { content: "orphan reply", meetingId },
    });

    expect(chatEvents(alice)).to.have.length(0);
    should.not.exist(findMessage(bob, "orphan reply"));
  });

  it("refuses commands as replies and replies aimed at another meeting", async function () {
    const [alice, bob] = users;
    const meetingId = game.pregame.id;

    alice.socket.sendToServer("speak", { content: "hello there", meetingId });
    const original = findMessage(bob, "hello there");
    alice.socket.flushMessages();

    bob.socket.sendToServer("reply", {
      quote: quoteOf(original, meetingId),
      message: { content: "/roll", meetingId },
    });
    bob.socket.sendToServer("reply", {
      quote: quoteOf(original, meetingId),
      message: { content: "elsewhere", meetingId: "someOtherMeeting" },
    });

    expect(chatEvents(alice)).to.have.length(0);
  });

  it("sends neither part while the sender is rate limited", async function () {
    const [alice, bob] = users;
    const meetingId = game.pregame.id;

    alice.socket.sendToServer("speak", { content: "spam target", meetingId });
    const original = findMessage(bob, "spam target");

    // Fill bob's limit with quick lines until the server starts refusing.
    let sent = 0;
    for (let i = 0; i < 50; i++) {
      bob.socket.flushMessages();
      bob.socket.sendToServer("speak", { content: `line ${i}`, meetingId });
      if (!findMessage(bob, `line ${i}`)) break;
      sent++;
    }
    expect(sent).to.be.greaterThan(0);

    alice.socket.flushMessages();
    bob.socket.flushMessages();
    bob.socket.sendToServer("reply", {
      quote: quoteOf(original, meetingId),
      message: { content: "rate limited reply", meetingId },
    });

    expect(chatEvents(alice)).to.have.length(0);
    expect(
      bob.socket.clientMessages.some((m) => m.eventName == "speakCooldown")
    ).to.equal(true);
  });
});
