const chai = require("chai");
chai.should();

const Frustrated = require("../../../Games/types/Mafia/effects/Frustrated");
const isFrustratedLowest = Frustrated.isFrustratedLowest;

describe("isFrustratedLowest", function () {
  it("is true when the player is the strict unique lowest", function () {
    isFrustratedLowest({ F: 1, A: 2 }, "F").should.equal(true);
    isFrustratedLowest({ F: 1, A: 2, B: 4 }, "F").should.equal(true);
  });

  it("is false when someone received fewer votes", function () {
    isFrustratedLowest({ F: 2, A: 1 }, "F").should.equal(false);
  });

  it("is false on a tie for lowest", function () {
    isFrustratedLowest({ F: 1, B: 1, A: 3 }, "F").should.equal(false);
  });

  it("is false when they are the only player who received votes", function () {
    isFrustratedLowest({ F: 4 }, "F").should.equal(false);
    isFrustratedLowest({ F: 4, "*": 9 }, "F").should.equal(false);
  });

  it("is false when they received no votes", function () {
    isFrustratedLowest({ A: 3 }, "F").should.equal(false);
    isFrustratedLowest({ F: 0, A: 3 }, "F").should.equal(false);
  });

  it("ignores no-one, magus, zero, and negative counts", function () {
    isFrustratedLowest(
      { F: 1, A: 2, "*": 1, "*magus": 1, B: 0, C: -5 },
      "F"
    ).should.equal(true);

    // A lower "*" would mask F if it were counted.
    isFrustratedLowest({ F: 2, A: 3, "*": 1 }, "F").should.equal(true);
  });

  it("compares weighted totals", function () {
    isFrustratedLowest({ F: 1, A: 10000 }, "F").should.equal(true);
    isFrustratedLowest({ F: 10000, A: 3 }, "F").should.equal(false);
    isFrustratedLowest({ F: 20000, A: 1 }, "F").should.equal(false);
    isFrustratedLowest({ F: 1, A: 3 }, "King").should.equal(false);
    isFrustratedLowest({ King: 1, A: 3 }, "King").should.equal(true);
  });

  it("accepts a numeric player id", function () {
    isFrustratedLowest({ 5: 1, 6: 4 }, 5).should.equal(true);
  });
});
