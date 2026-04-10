const chai = require("chai"),
  assert = chai.assert,
  should = chai.should();
const {
  winRateFromAlignmentEntries,
  buildPayoutWeights,
  computeFactionFortunePoints,
  alignmentRowsToWinRateMap,
  shouldCapFortuneAt120,
} = require("../modules/fortunePoints");

describe("modules/fortunePoints", function () {
  describe("winRateFromAlignmentEntries", function () {
    it("should only count ranked and competitive rows, ignoring unranked", function () {
      const entries = [
        ["ranked", true],
        ["unranked", false],
        ["unranked", false],
        ["competitive", true],
      ];
      winRateFromAlignmentEntries(entries).should.equal(1);
    });

    it("should return 1.0 when one ranked win is mixed with many unranked losses", function () {
      const entries = [["ranked", true]];
      for (let i = 0; i < 10; i++) entries.push(["unranked", false]);
      winRateFromAlignmentEntries(entries).should.equal(1);
    });

    it("should return null when only unranked rows exist", function () {
      const entries = [
        ["unranked", true],
        ["unranked", false],
        ["unranked", true],
      ];
      (winRateFromAlignmentEntries(entries) === null).should.be.true;
    });

    it("should return null for empty or missing input", function () {
      (winRateFromAlignmentEntries([]) === null).should.be.true;
      (winRateFromAlignmentEntries(null) === null).should.be.true;
      (winRateFromAlignmentEntries(undefined) === null).should.be.true;
    });

    it("should aggregate ranked and competitive rows together", function () {
      const entries = [
        ["ranked", true],
        ["ranked", true],
        ["competitive", false],
        ["competitive", false],
      ];
      winRateFromAlignmentEntries(entries).should.equal(0.5);
    });
  });

  describe("alignmentRowsToWinRateMap", function () {
    it("should group alignmentRows by faction key as [gameType, won] pairs", function () {
      const setupStats = {
        alignmentRows: [
          ["Village", "ranked", true],
          ["Mafia", "ranked", false],
          ["Village", "competitive", false],
          ["Mafia", "unranked", true],
        ],
      };
      const map = alignmentRowsToWinRateMap(setupStats);
      map.should.have.property("Village");
      map.should.have.property("Mafia");
      map.Village.length.should.equal(2);
      map.Mafia.length.should.equal(2);
      map.Village[0].should.deep.equal(["ranked", true]);
    });

    it("should ignore legacy alignmentWinRates object shape", function () {
      const setupStats = {
        alignmentWinRates: {
          Village: [true, true, false],
          Mafia: [false, false, true],
        },
      };
      const map = alignmentRowsToWinRateMap(setupStats);
      Object.keys(map).length.should.equal(0);
    });

    it("should return empty map for null / missing setupStats", function () {
      Object.keys(alignmentRowsToWinRateMap(null)).length.should.equal(0);
      Object.keys(alignmentRowsToWinRateMap(undefined)).length.should.equal(0);
      Object.keys(alignmentRowsToWinRateMap({})).length.should.equal(0);
    });
  });

  describe("computeFactionFortunePoints - 2-faction payouts", function () {
    it("should split points 50/50 for a balanced Village vs Mafia history", function () {
      const alignmentWinRates = {
        Village: [
          ["ranked", true],
          ["ranked", true],
          ["ranked", false],
          ["ranked", false],
        ],
        Mafia: [
          ["ranked", true],
          ["ranked", true],
          ["ranked", false],
          ["ranked", false],
        ],
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia"],
          alignmentWinRates,
        });
      pointsWonByFactions.Village.should.equal(60);
      pointsWonByFactions.Mafia.should.equal(60);
      pointsLostByFactions.Village.should.equal(60);
      pointsLostByFactions.Mafia.should.equal(60);
    });

    it("should skew payouts toward the underdog on a 70/30 win rate", function () {
      const alignmentWinRates = {
        Village: [
          ["ranked", true],
          ["ranked", true],
          ["ranked", true],
          ["ranked", true],
          ["ranked", true],
          ["ranked", true],
          ["ranked", true],
          ["ranked", false],
          ["ranked", false],
          ["ranked", false],
        ],
        Mafia: [
          ["ranked", true],
          ["ranked", true],
          ["ranked", true],
          ["ranked", false],
          ["ranked", false],
          ["ranked", false],
          ["ranked", false],
          ["ranked", false],
          ["ranked", false],
          ["ranked", false],
        ],
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia"],
          alignmentWinRates,
        });
      pointsWonByFactions.Village.should.equal(84);
      pointsWonByFactions.Mafia.should.equal(36);
      pointsLostByFactions.Village.should.equal(36);
      pointsLostByFactions.Mafia.should.equal(84);
    });

    it("should count ranked and competitive rows toward the same faction rate", function () {
      const alignmentWinRates = {
        Village: [
          ["ranked", true],
          ["competitive", true],
        ],
        Mafia: [
          ["ranked", false],
          ["competitive", false],
        ],
      };
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        alignmentWinRates,
      });
      pointsWonByFactions.Village.should.equal(120);
      pointsWonByFactions.Mafia.should.equal(0);
    });

    it("should ignore unranked rows when computing payouts", function () {
      const alignmentWinRates = {
        Village: [
          ["ranked", true],
          ["ranked", false],
          ["unranked", false],
          ["unranked", false],
          ["unranked", false],
        ],
        Mafia: [
          ["ranked", true],
          ["ranked", false],
          ["unranked", true],
          ["unranked", true],
          ["unranked", true],
        ],
      };
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        alignmentWinRates,
      });
      pointsWonByFactions.Village.should.equal(60);
      pointsWonByFactions.Mafia.should.equal(60);
    });

    it("should fall back to equal weights when a faction has only unranked data", function () {
      const alignmentWinRates = {
        Village: [
          ["ranked", true],
          ["ranked", false],
        ],
        Mafia: [
          ["unranked", true],
          ["unranked", true],
        ],
      };
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        alignmentWinRates,
      });
      pointsWonByFactions.Village.should.equal(60);
      pointsWonByFactions.Mafia.should.equal(60);
    });
  });

  describe("computeFactionFortunePoints - independents and cap", function () {
    it("should cap an independent faction's win payout at 120 when K exceeds 120", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Jester"],
        alignmentWinRates: {},
        K: 500,
      });
      pointsWonByFactions.Jester.should.equal(120);
    });

    it("should not cap Village, Mafia, or Cult regardless of K", function () {
      const village = computeFactionFortunePoints({
        factionNames: ["Village"],
        alignmentWinRates: {},
        K: 500,
      });
      village.pointsWonByFactions.Village.should.equal(500);

      const mafia = computeFactionFortunePoints({
        factionNames: ["Mafia"],
        alignmentWinRates: {},
        K: 500,
      });
      mafia.pointsWonByFactions.Mafia.should.equal(500);

      const cult = computeFactionFortunePoints({
        factionNames: ["Cult"],
        alignmentWinRates: {},
        K: 500,
      });
      cult.pointsWonByFactions.Cult.should.equal(500);
    });

    it("should not cap Traitor despite being an odd faction", function () {
      shouldCapFortuneAt120("Traitor").should.be.false;
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Traitor"],
        alignmentWinRates: {},
        K: 500,
      });
      pointsWonByFactions.Traitor.should.equal(500);
    });

    it("should not cap faction keys ending in 'Mafia' (e.g., RedMafia)", function () {
      shouldCapFortuneAt120("RedMafia").should.be.false;
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["RedMafia"],
        alignmentWinRates: {},
        K: 500,
      });
      pointsWonByFactions.RedMafia.should.equal(500);
    });

    it("should cap each independent individually in a multi-independent setup", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Serial Killer", "Hunter"],
        alignmentWinRates: {},
        K: 600,
      });
      // all 4 missing data -> equal weights = 0.25 each -> winPts = 150 raw
      pointsWonByFactions.Village.should.equal(150);
      pointsWonByFactions.Mafia.should.equal(150);
      pointsWonByFactions["Serial Killer"].should.equal(120);
      pointsWonByFactions.Hunter.should.equal(120);
    });

    it("should still compute loss points uncapped for independents", function () {
      const { pointsLostByFactions } = computeFactionFortunePoints({
        factionNames: ["Jester"],
        alignmentWinRates: {},
        K: 500,
      });
      pointsLostByFactions.Jester.should.equal(0);
    });
  });

  describe("computeFactionFortunePoints - degenerate shapes", function () {
    it("should give a lone faction weight 1.0 and full payout", function () {
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village"],
          alignmentWinRates: {},
        });
      pointsWonByFactions.Village.should.equal(120);
      pointsLostByFactions.Village.should.equal(0);
    });

    it("should use equal weights when all factions are missing data", function () {
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia", "Cult"],
          alignmentWinRates: {},
        });
      pointsWonByFactions.Village.should.equal(40);
      pointsWonByFactions.Mafia.should.equal(40);
      pointsWonByFactions.Cult.should.equal(40);
      pointsLostByFactions.Village.should.equal(80);
      pointsLostByFactions.Mafia.should.equal(80);
      pointsLostByFactions.Cult.should.equal(80);
    });

    it("should return empty objects for an empty factionNames list", function () {
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: [],
          alignmentWinRates: {},
        });
      Object.keys(pointsWonByFactions).length.should.equal(0);
      Object.keys(pointsLostByFactions).length.should.equal(0);
    });

    it("should end-to-end filter unranked rows when fed through alignmentRowsToWinRateMap", function () {
      const setupStats = {
        alignmentRows: [
          ["Village", "ranked", true],
          ["Village", "unranked", false],
          ["Village", "unranked", false],
          ["Mafia", "ranked", false],
          ["Mafia", "unranked", true],
          ["Mafia", "unranked", true],
        ],
      };
      const alignmentWinRates = alignmentRowsToWinRateMap(setupStats);
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        alignmentWinRates,
      });
      pointsWonByFactions.Village.should.equal(120);
      pointsWonByFactions.Mafia.should.equal(0);
    });
  });
});
