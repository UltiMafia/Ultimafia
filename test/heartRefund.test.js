const { expect } = require("chai");
const { refundTargets } = require("../modules/heartRefund");

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
