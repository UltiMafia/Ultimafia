const chai = require("chai");
const should = chai.should();

const boardLogic = require("../../../Games/types/Battleship/boardLogic");
const constants = require("../../../data/constants");

const {
  SHIP_SPECS,
  SHIP_TYPES,
  validateFleet,
  resolveFire,
  allShipsSunk,
} = boardLogic;

function validFleet() {
  return [
    { type: "carrier", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
    { type: "battleship", cells: [[1, 0], [1, 1], [1, 2], [1, 3]] },
    { type: "cruiser", cells: [[2, 0], [2, 1], [2, 2]] },
    { type: "submarine", cells: [[3, 0], [3, 1], [3, 2]] },
    { type: "destroyer", cells: [[4, 0], [4, 1]] },
  ];
}

function emptyBoardState() {
  return { fleet: [], placementReady: false, shots: {} };
}

describe("Games/Battleship", function () {
  describe("player limit", function () {
    it("is fixed at 2 players for release", function () {
      constants.fixedPlayerTotals.Battleship.should.equal(2);
    });
  });

  describe("validateFleet", function () {
    it("accepts a valid classic fleet", function () {
      should.not.exist(validateFleet(validFleet()));
    });

    it("rejects overlapping ships", function () {
      const fleet = validFleet();
      fleet[1].cells = [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ];
      validateFleet(fleet).should.match(/overlap/i);
    });

    it("rejects diagonal ships", function () {
      const fleet = validFleet();
      fleet[4].cells = [
        [4, 0],
        [5, 1],
      ];
      validateFleet(fleet).should.match(/straight/i);
    });

    it("rejects wrong ship length", function () {
      const fleet = validFleet();
      fleet[4].cells = [[4, 0]];
      validateFleet(fleet).should.match(/destroyer/i);
    });
  });

  describe("allShipsSunk", function () {
    it("does not treat an empty fleet as sunk", function () {
      allShipsSunk([]).should.be.false;
    });

    it("does not treat an unplaced fleet as sunk before all ships are hit", function () {
      allShipsSunk([
        { type: "destroyer", cells: [[0, 0], [0, 1]], hits: 0 },
      ]).should.be.false;
    });
  });

  describe("resolveFire", function () {
    it("marks hits and detects a sink win", function () {
      const attacker = emptyBoardState();
      const defender = emptyBoardState();
      defender.fleet = [
        { type: "destroyer", cells: [[9, 9], [9, 8]], hits: 0 },
      ];

      const first = resolveFire(attacker, defender, 9, 9);
      should.not.exist(first.error);
      first.result.should.equal("hit");
      first.won.should.be.false;

      const second = resolveFire(attacker, defender, 9, 8);
      second.won.should.be.true;
      attacker.shots["9,9"].result.should.equal("sunk");
      attacker.shots["9,8"].result.should.equal("sunk");
    });

    it("does not declare a win against an empty fleet", function () {
      const attacker = emptyBoardState();
      const defender = emptyBoardState();

      const outcome = resolveFire(attacker, defender, 0, 0);
      should.not.exist(outcome.error);
      outcome.result.should.equal("miss");
      outcome.won.should.be.false;
    });

    it("rejects duplicate shots", function () {
      const attacker = emptyBoardState();
      const defender = emptyBoardState();
      attacker.shots["5,5"] = { result: "hit" };

      const outcome = resolveFire(attacker, defender, 5, 5);
      outcome.error.should.match(/already fired/i);
    });
  });

  describe("constants", function () {
    it("uses the standard 5-ship loadout", function () {
      SHIP_TYPES.should.have.lengthOf(5);
      SHIP_SPECS.carrier.should.equal(5);
      SHIP_SPECS.destroyer.should.equal(2);
    });
  });
});
