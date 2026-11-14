const { expect } = require("chai");
const { refundTargets, accountIdOf } = require("../modules/heartRefund");

describe("refundTargets", function () {
  const charged = { userIds: ["a", "b", "c"], red: 0, gold: 1 };

  it("pays back everyone who was charged", function () {
    expect(refundTargets({ charged })).to.deep.equal(["a", "b", "c"]);
  });

  it("pays a player who left before the break", function () {
    // The reported case: the departed player is no longer in the seat list, so
    // a seat-based loop skipped them and they lost a heart for a break that
    // was not theirs.
    expect(refundTargets({ charged, excludedUserId: "b" })).to.deep.equal([
      "a",
      "c",
    ]);
  });

  it("does not pay the player responsible for the break", function () {
    expect(refundTargets({ charged, excludedUserId: "a" })).to.not.include("a");
  });

  it("does not pay any of the players who broke the game together", function () {
    // A vote timing out without a majority vegs every member who did not vote,
    // in one loop: none of those players is owed a heart back.
    expect(
      refundTargets({ charged, excludedUserIds: new Set(["a", "b"]) })
    ).to.deep.equal(["c"]);
  });

  it("pays the dead players when every alive player was responsible", function () {
    // The reported game: all alive players vegged at the end of a day. The
    // player who had already died and left was not responsible and is owed
    // their heart back.
    const game = { userIds: ["alive1", "alive2", "dead"] };
    expect(
      refundTargets({
        charged: game,
        excludedUserIds: new Set(["alive1", "alive2"]),
      })
    ).to.deep.equal(["dead"]);
  });

  it("does not pay anyone twice", function () {
    const refunded = new Set(["b"]);
    expect(refundTargets({ charged, refunded })).to.deep.equal(["a", "c"]);
  });

  it("treats a missing charge record as nothing to refund", function () {
    expect(refundTargets({ charged: null })).to.deep.equal([]);
    expect(refundTargets({ charged: {} })).to.deep.equal([]);
  });

  it("ignores empty ids", function () {
    expect(
      refundTargets({ charged: { userIds: ["", "a", null, undefined] } })
    ).to.deep.equal(["a"]);
  });
});

describe("accountIdOf", function () {
  it("reads the account id of an ordinary seat", function () {
    expect(accountIdOf({ user: { id: "u2" } })).to.equal("u2");
  });

  it("reads the account id of an anonymous seat", function () {
    // makeAnonymous deletes user.id and keeps the real account here; without
    // this fallback the first anonymous breaker would be refunded.
    expect(accountIdOf({ user: {}, originalProfile: { userId: "u1" } })).to.equal(
      "u1"
    );
  });

  it("prefers an explicit userId", function () {
    expect(
      accountIdOf({ userId: "bot", user: { id: "u2" }, originalProfile: {} })
    ).to.equal("bot");
  });

  it("returns undefined when there is no account behind the seat", function () {
    expect(accountIdOf(null)).to.equal(undefined);
    expect(accountIdOf({ user: {} })).to.equal(undefined);
  });
});
