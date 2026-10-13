const chai = require("chai");
const expect = chai.expect;
const Random = require("../../lib/Random");
const constants = require("../../data/constants");
const credentials = require("../../modules/devApi/credentials");
const { placementError, isTestingGame } = require("../../modules/devApi/policy");
const devControls = require("../../Games/core/devControls");
const { stringifyMessage, parseMessage, splitMeta } = require("../../lib/sockets");

const testingGame = { lobby: "Testing", status: "Open", settings: { private: true } };
const privateGame = { lobby: "Main", status: "Open", settings: { private: true } };
const publicGame = { lobby: "Main", status: "Open", settings: { private: false } };

describe("devApi/credentials", function () {
  it("never stores the secret and only matches the right one", function () {
    const { clientId, clientSecret, secretHash } = credentials.newCredentials();
    expect(clientId).to.match(/^ufd_/);
    expect(secretHash).to.not.include(clientSecret);
    expect(credentials.secretMatches(clientSecret, secretHash)).to.equal(true);
    expect(credentials.secretMatches(clientSecret + "x", secretHash)).to.equal(false);
    expect(credentials.secretMatches(clientSecret, "")).to.equal(false);
  });

  it("rejects revoked and expired keys", function () {
    const now = 1000;
    expect(credentials.keyIsUsable({ expiresAt: 2000 }, now)).to.equal(true);
    expect(credentials.keyIsUsable({ expiresAt: 2000, revokedAt: 500 }, now)).to.equal(false);
    expect(credentials.keyIsUsable({ expiresAt: 900 }, now)).to.equal(false);
    expect(credentials.keyIsUsable(null, now)).to.equal(false);
  });
});

describe("devApi/policy", function () {
  const base = { developerAccounts: 0, gameTestAccounts: 0, canUsePublic: false };

  it("allows Testing lobby and private games", function () {
    expect(placementError({ ...base, game: testingGame })).to.equal(null);
    expect(placementError({ ...base, game: privateGame })).to.equal(null);
    expect(isTestingGame(testingGame)).to.equal(true);
    expect(isTestingGame(privateGame)).to.equal(false);
  });

  it("blocks public games without the grant", function () {
    expect(placementError({ ...base, game: publicGame })).to.match(/locked lobbies/);
  });

  it("allows one test account in a public game with the grant", function () {
    expect(placementError({ ...base, game: publicGame, canUsePublic: true })).to.equal(null);
    expect(
      placementError({ ...base, game: publicGame, canUsePublic: true, gameTestAccounts: 1 })
    ).to.match(/Only 1 test account/);
  });

  it("caps each developer at 50 test accounts in games", function () {
    const cap = constants.devApi.maxTestAccountsInGame;
    expect(cap).to.equal(50);
    expect(placementError({ ...base, game: testingGame, developerAccounts: cap - 1 })).to.equal(null);
    expect(placementError({ ...base, game: testingGame, developerAccounts: cap })).to.match(/at most 50/);
  });

  it("only joins open games", function () {
    expect(placementError({ ...base, game: { ...testingGame, status: "In Progress" } })).to.match(/open games/);
    expect(placementError({ ...base, game: undefined })).to.match(/not found/);
  });
});

describe("devApi/devControls", function () {
  it("scales timers but never below the floor", function () {
    expect(devControls.scaleTimerDelay(600000, 1)).to.equal(600000);
    expect(devControls.scaleTimerDelay(600000, 0.05)).to.equal(30000);
    expect(devControls.scaleTimerDelay(5000, 0.01)).to.equal(constants.devApi.minScaledTimerMs);
  });

  it("puts forced players into slots for their roles", function () {
    const players = ["a", "b", "c", "d"].map((id) => ({ id, name: id.toUpperCase() }));
    const roleset = { "Villager:": 2, "Mafioso:": 1, "Cop:": 1 };
    const ordered = devControls.orderPlayersForForcedRoles(players, roleset, { A: "Mafioso", d: "Cop" });
    const slots = ["Villager:", "Villager:", "Mafioso:", "Cop:"];
    const roleOf = (id) => slots[ordered.findIndex((p) => p.id == id)];
    expect(ordered).to.have.length(4);
    expect(roleOf("a")).to.equal("Mafioso:");
    expect(roleOf("d")).to.equal("Cop:");
  });

  it("refuses to run outside the Testing lobby", function () {
    expect(() => devControls.runDevControl({ lobby: "Main" }, "state")).to.throw(/Testing lobby/);
  });
});

describe("lib/Random seeded source", function () {
  it("repeats the same sequence for a seed and restores the secure source", function () {
    const run = () =>
      Random.withSource(Random.seededSource("abc"), () => Random.randomizeArray([1, 2, 3, 4, 5, 6, 7, 8]));
    expect(run()).to.deep.equal(run());
    const outside = Random.randFloat();
    expect(outside).to.be.within(0, 1);
  });
});

describe("lib/sockets seq metadata", function () {
  it("leaves frames unchanged unless the client opted in", function () {
    expect(splitMeta("vote:object:{}")).to.deep.equal({ message: "vote:object:{}" });
  });

  it("parses opted-in frames back into the original message", function () {
    const framed = `@7,1700000000000|${stringifyMessage("vote", { a: 1 })}`;
    const { seq, t, message } = splitMeta(framed);
    expect(seq).to.equal(7);
    expect(t).to.equal(1700000000000);
    expect(parseMessage(message)).to.deep.equal(["vote", { a: 1 }]);
  });
});
