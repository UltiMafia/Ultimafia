const chai = require("chai");
const should = chai.should();

require("../helpers/pushConfig");

const webpush = require("web-push");
const push = require("../../modules/pushNotifications");
const kicksReminder = require("../../Games/core/kicksReminder");

function subscription(name) {
  return {
    endpoint: `https://push.example.com/${name}`,
    keys: { p256dh: "p256dh-key", auth: "auth-key" },
  };
}

function makeMeeting(playerId, overrides = {}) {
  return {
    voting: true,
    noVeg: false,
    finished: false,
    votes: {},
    members: { [playerId]: { canVote: true, canUpdateVote: true } },
    ...overrides,
  };
}

function makePlayer(id, overrides = {}) {
  return {
    id,
    alive: true,
    left: false,
    isBot: false,
    user: { id: `account-${id}` },
    meetings: [makeMeeting(id)],
    getMeetings() {
      return this.meetings;
    },
    ...overrides,
  };
}

function makeGame(players, overrides = {}) {
  return {
    id: "game1",
    currentState: 4,
    players,
    isNoVeg: () => false,
    ...overrides,
  };
}

describe("Games/core/kicksReminder", function () {
  describe("needsAction", function () {
    it("includes a player who still owes an action", function () {
      const player = makePlayer("p1");
      kicksReminder.needsAction(player, makeGame([player])).should.be.true;
    });

    it("includes a player with one outstanding meeting among several", function () {
      const player = makePlayer("p1", {
        meetings: [
          makeMeeting("p1", { votes: { p1: "someone" } }),
          makeMeeting("p1"),
        ],
      });

      kicksReminder.needsAction(player, makeGame([player])).should.be.true;
    });

    it("excludes a player who has voted in every meeting", function () {
      const player = makePlayer("p1", {
        meetings: [makeMeeting("p1", { votes: { p1: "someone" } })],
      });

      kicksReminder.needsAction(player, makeGame([player])).should.be.false;
    });

    it("includes a player whose multi-select action is half filled in", function () {
      // Meeting.finish vegs a short multi selection, so it is not "done".
      const partial = makePlayer("p1", {
        meetings: [
          makeMeeting("p1", {
            multi: true,
            multiMin: 2,
            votes: { p1: ["a"] },
          }),
        ],
      });
      const full = makePlayer("p2", {
        meetings: [
          makeMeeting("p2", {
            multi: true,
            multiMin: 2,
            votes: { p2: ["a", "b"] },
          }),
        ],
      });
      const skipped = makePlayer("p3", {
        meetings: [
          makeMeeting("p3", {
            multi: true,
            multiMin: 2,
            votes: { p3: ["*"] },
          }),
        ],
      });

      kicksReminder.needsAction(partial, makeGame([partial])).should.be.true;
      kicksReminder.needsAction(full, makeGame([full])).should.be.false;
      kicksReminder.needsAction(skipped, makeGame([skipped])).should.be.false;
    });

    it("excludes finished, noVeg and non-voting meetings", function () {
      const player = makePlayer("p1", {
        meetings: [
          makeMeeting("p1", { finished: true }),
          makeMeeting("p1", { noVeg: true }),
          makeMeeting("p1", { voting: false }),
        ],
      });

      kicksReminder.needsAction(player, makeGame([player])).should.be.false;
    });

    it("excludes a player the meeting would not veg", function () {
      // A member who cannot vote (or cannot change a vote) is skipped by the
      // veg loop in Meeting.finish, so there is nothing to remind them about.
      const cannotVote = makePlayer("p1", {
        meetings: [makeMeeting("p1", { members: { p1: { canVote: false } } })],
      });
      const cannotUpdate = makePlayer("p2", {
        meetings: [
          makeMeeting("p2", {
            members: { p2: { canVote: true, canUpdateVote: false } },
          }),
        ],
      });
      const notAMember = makePlayer("p3", {
        meetings: [makeMeeting("p3", { members: {} })],
      });

      const game = makeGame([cannotVote, cannotUpdate, notAMember]);
      kicksReminder.recipients(game).should.have.lengthOf(0);
    });

    it("excludes dead, departed, bot and guest players", function () {
      const game = makeGame([
        makePlayer("dead", { alive: false }),
        makePlayer("gone", { left: true }),
        makePlayer("bot", { isBot: true }),
        makePlayer("guest", { user: { id: "account-guest", guestId: "g" } }),
        makePlayer("anonymous-bot", {
          isBot: true, user: {}, originalProfile: { userId: "account-bot" },
        }),
        makePlayer("anonymous-guest", {
          user: { guestId: "g" }, originalProfile: { userId: "account-guest" },
        }),
        makePlayer("noaccount", { user: {} }),
        makePlayer("nouser", { user: null }),
        makePlayer("live"),
      ]);

      const ids = kicksReminder.recipients(game).map((p) => p.id);
      ids.should.deep.equal(["live"]);
    });

    it("excludes everyone in a noVeg game", function () {
      const players = [makePlayer("p1"), makePlayer("p2")];

      kicksReminder
        .recipients(makeGame(players, { isNoVeg: () => true }))
        .should.have.lengthOf(0);
    });
  });

  describe("claim", function () {
    it("returns the recipients and records a marker each", function () {
      const players = [makePlayer("p1"), makePlayer("p2")];
      const sent = new Set();

      const claimed = kicksReminder.claim(makeGame(players), sent);

      claimed.map((p) => p.id).should.deep.equal(["p1", "p2"]);
      sent.size.should.equal(2);
      sent.has(kicksReminder.dedupeKey(makeGame([players[0]]), players[0])).should
        .be.true;
    });

    it("claims nobody a second time in the same kicks window", function () {
      const game = makeGame([makePlayer("p1"), makePlayer("p2")]);
      const sent = new Set();

      kicksReminder.claim(game, sent).should.have.lengthOf(2);
      // A retry, a double fire, or checkVeg running twice.
      kicksReminder.claim(game, sent).should.have.lengthOf(0);
    });

    it("claims again in a later state", function () {
      const game = makeGame([makePlayer("p1")]);
      const sent = new Set();

      kicksReminder.claim(game, sent).should.have.lengthOf(1);

      game.currentState = 5;
      kicksReminder.claim(game, sent).should.have.lengthOf(1);
    });
  });

  describe("payload", function () {
    it("follows payload contract v1", function () {
      const original = process.env.BASE_URL;
      process.env.BASE_URL = "https://ultimafia.com";

      try {
        const payload = kicksReminder.payload(makeGame([]));

        payload.kind.should.equal("kicks-reminder");
        payload.gameId.should.equal("game1");
        payload.url.should.equal("https://ultimafia.com/game/game1");
        payload.tag.should.equal("game-game1");
        payload.state.should.equal(4);
        payload.title.should.be.a("string").that.is.not.empty;
        payload.body.should.be.a("string").that.is.not.empty;
        payload.timestamp.should.be.a("number");
      } finally {
        if (original == null) delete process.env.BASE_URL;
        else process.env.BASE_URL = original;
      }
    });
  });

  describe("notify", function () {
    let originalSend;
    let sent;

    beforeEach(function () {
      sent = [];
      originalSend = webpush.sendNotification;
      webpush.sendNotification = async (sub, payload) => {
        sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
      };

      push.register("kicks-user-1", subscription("one"));
      push.register("kicks-user-2", subscription("two"));
    });

    afterEach(function () {
      webpush.sendNotification = originalSend;
      push.unregisterUser("kicks-user-1");
      push.unregisterUser("kicks-user-2");
    });

    it("sends the reminder to players who still owe an action", async function () {
      const game = makeGame([
        makePlayer("p1", { user: { id: "kicks-user-1" } }),
        makePlayer("p2", {
          user: { id: "kicks-user-2" },
          meetings: [makeMeeting("p2", { votes: { p2: "someone" } })],
        }),
      ]);

      const report = await kicksReminder.notify(game, new Set());

      sent.should.have.lengthOf(1);
      sent[0].payload.kind.should.equal("kicks-reminder");
      sent[0].payload.gameId.should.equal("game1");
      sent[0].payload.url.should.equal(
        `${process.env.BASE_URL || ""}/game/game1`
      );
      sent[0].payload.tag.should.equal("game-game1");
      report.recipients.should.equal(1);
      report.sent.should.equal(1);
    });

    it("does not deliver to an opted-out account or a subscribed spectator", async function () {
      const optedOut = makePlayer("opted-out", {
        user: { id: "kicks-user-1" },
      });
      const pending = makePlayer("pending", {
        user: { id: "kicks-user-2" },
      });
      // Opt-out uses the existing subscription registry, not a new preference.
      push.unregisterUser(optedOut.user.id);
      const spectator = makePlayer("spectator", {
        user: { id: "kicks-user-spectator" },
      });
      push.register(spectator.user.id, subscription("spectator"));
      const game = makeGame([optedOut, pending], { spectators: [spectator] });

      try {
        const report = await kicksReminder.notify(game, new Set());

        report.sent.should.equal(1);
        sent.map((delivery) => delivery.endpoint).should.deep.equal([
          subscription("two").endpoint,
        ]);
      } finally {
        push.unregisterUser(spectator.user.id);
      }
    });

    it("sends nothing on a second trigger in the same kicks window", async function () {
      const alreadySent = new Set();
      const game = makeGame([makePlayer("p1", { user: { id: "kicks-user-1" } })]);

      (await kicksReminder.notify(game, alreadySent)).sent.should.equal(1);
      should.not.exist(await kicksReminder.notify(game, alreadySent));
      sent.should.have.lengthOf(1);
    });

    it("reports a failed device without aborting the rest of the batch", async function () {
      webpush.sendNotification = async (sub, payload) => {
        if (sub.endpoint.endsWith("one")) {
          const err = new Error("push service down");
          err.statusCode = 503;
          throw err;
        }
        sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
      };

      const game = makeGame([
        makePlayer("p1", { user: { id: "kicks-user-1" } }),
        makePlayer("p2", { user: { id: "kicks-user-2" } }),
      ]);

      const report = await kicksReminder.notify(game, new Set());

      report.recipients.should.equal(2);
      report.sent.should.equal(1);
      report.failed.should.equal(1);
      sent.should.have.lengthOf(1);
      sent[0].endpoint.should.equal("https://push.example.com/two");
    });

    it("resolves instead of throwing when the send path cannot run", async function () {
      // checkVeg() must complete even if this blows up.
      const game = {
        id: "game1",
        currentState: 4,
        isNoVeg: () => false,
        get players() {
          throw new Error("boom");
        },
      };

      const report = await kicksReminder.notify(game, new Set());
      should.not.exist(report);
      sent.should.have.lengthOf(0);
    });
  });
});
