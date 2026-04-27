const chai = require("chai");
const should = chai.should();
const {
  tierRank,
  maxTier,
  pickAvailableStampIds,
} = require("../shared/stampBorder");

// Helper: build a fake stamp doc the way models.Stamp.find().select("_id borderType")
// would return it. Order matters — `pickAvailableStampIds` is stable on ties.
function s(id, borderType) {
  return { _id: id, borderType };
}

describe("shared/stampBorder", function () {
  describe("tierRank", function () {
    it("ranks competitive > ranked > unranked", function () {
      tierRank("c").should.be.greaterThan(tierRank("r"));
      tierRank("r").should.be.greaterThan(tierRank("u"));
    });

    it("treats unknown / missing borderType as the lowest tier (u)", function () {
      tierRank(undefined).should.equal(tierRank("u"));
      tierRank(null).should.equal(tierRank("u"));
      tierRank("").should.equal(tierRank("u"));
      tierRank("nonsense").should.equal(tierRank("u"));
    });
  });

  describe("maxTier", function () {
    it("returns the higher-tier borderType", function () {
      maxTier("u", "c").should.equal("c");
      maxTier("r", "u").should.equal("r");
      maxTier("c", "r").should.equal("c");
    });

    it("returns the first arg on ties (stable for grouping aggregates)", function () {
      maxTier("r", "r").should.equal("r");
      maxTier("u", "u").should.equal("u");
    });

    it("treats unknown borderType as u (lowest)", function () {
      maxTier("c", "nonsense").should.equal("c");
      maxTier("nonsense", "r").should.equal("r");
    });
  });

  describe("pickAvailableStampIds", function () {
    it("returns lowest-tier stamps first so rare/competitive copies are kept", function () {
      const stamps = [s("comp1", "c"), s("rank1", "r"), s("unr1", "u")];
      const order = pickAvailableStampIds(stamps, new Set());
      order.should.deep.equal(["unr1", "rank1", "comp1"]);
    });

    it("preserves input order on tier ties (deterministic gift selection)", function () {
      const stamps = [s("u-a", "u"), s("u-b", "u"), s("u-c", "u")];
      const order = pickAvailableStampIds(stamps, new Set());
      order.should.deep.equal(["u-a", "u-b", "u-c"]);
    });

    it("excludes locked stamp ids (already attached to another active trade)", function () {
      const stamps = [s("a", "u"), s("b", "u"), s("c", "u")];
      const locked = new Set(["b"]);
      const order = pickAvailableStampIds(stamps, locked);
      order.should.deep.equal(["a", "c"]);
    });

    it("treats stamps without borderType as the unranked tier", function () {
      // Pre-borderType stamps stored in the DB may have the field missing
      // entirely; they must still be tradeable and rank below explicit r/c.
      const stamps = [s("legacy", undefined), s("comp", "c"), s("rank", "r")];
      const order = pickAvailableStampIds(stamps, new Set());
      order[0].should.equal("legacy");
      order[order.length - 1].should.equal("comp");
    });

    it("filters out locked competitive stamps but keeps the unranked fallback", function () {
      // The user has only one unranked copy + a locked competitive copy.
      // Selection should yield the unranked copy alone — caller decides if
      // count is sufficient (the route requires >= 2 available for trades).
      const stamps = [s("c-locked", "c"), s("u-1", "u")];
      const order = pickAvailableStampIds(stamps, new Set(["c-locked"]));
      order.should.deep.equal(["u-1"]);
    });

    it("returns [] if every stamp is locked", function () {
      const stamps = [s("a", "u"), s("b", "r"), s("c", "c")];
      const order = pickAvailableStampIds(
        stamps,
        new Set(["a", "b", "c"])
      );
      order.should.deep.equal([]);
    });

    it("returns [] for an empty input list", function () {
      pickAvailableStampIds([], new Set()).should.deep.equal([]);
    });

    it("matches lock-set lookups via stringified ObjectId", function () {
      // Mongo _id is a non-string ObjectId-like value; the helper must
      // String()-coerce both sides for the Set lookup to work.
      const objLikeId = { toString: () => "abc123" };
      const stamps = [s(objLikeId, "u"), s("xyz", "u")];
      const order = pickAvailableStampIds(stamps, new Set(["abc123"]));
      order.should.deep.equal(["xyz"]);
    });

    it("orders mixed lock + tier scenarios end-to-end", function () {
      // Realistic scenario: user has 1 c (locked elsewhere), 2 r, 3 u (one
      // also locked). Trade selection should propose the 2 unlocked u's,
      // then the 2 r's, with the c excluded entirely.
      const stamps = [
        s("c1", "c"),
        s("r1", "r"),
        s("r2", "r"),
        s("u1", "u"),
        s("u2", "u"),
        s("u3", "u"),
      ];
      const locked = new Set(["c1", "u2"]);
      const order = pickAvailableStampIds(stamps, locked);
      order.should.deep.equal(["u1", "u3", "r1", "r2"]);
    });
  });
});
