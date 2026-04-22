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
      // Aggregation spans ranked + competitive; mixed 2W/1L per faction → 2/3 winrate each.
      const alignmentWinRates = {
        Village: [
          ["ranked", true],
          ["competitive", true],
          ["ranked", false],
        ],
        Mafia: [
          ["ranked", true],
          ["competitive", true],
          ["ranked", false],
        ],
      };
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        alignmentWinRates,
      });
      pointsWonByFactions.Village.should.equal(60);
      pointsWonByFactions.Mafia.should.equal(60);
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

    it("should give equal payouts in a 2-faction setup with no ranked/competitive history", function () {
      // Fresh setup — no rows recorded yet. Both factions fall back to equal weights.
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia"],
          alignmentWinRates: {},
        });
      pointsWonByFactions.Village.should.equal(60);
      pointsWonByFactions.Mafia.should.equal(60);
      pointsLostByFactions.Village.should.equal(60);
      pointsLostByFactions.Mafia.should.equal(60);
    });

    it("should give equal payouts end-to-end when setupStats has no alignmentRows", function () {
      // Simulates a SetupVersion doc that exists but whose setupStats has never been populated.
      const alignmentWinRates = alignmentRowsToWinRateMap({ alignmentRows: [] });
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

    it("should give a non-zero win payout to a faction with 0% historical winrate", function () {
      // Setup has been played 20 times ranked and Mafia won every single time.
      // A villager who finally defies the streak should not receive zero fortune.
      const alignmentWinRates = {
        Village: Array(20).fill(["ranked", false]),
        Mafia: Array(20).fill(["ranked", true]),
      };
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        alignmentWinRates,
      });
      pointsWonByFactions.Village.should.be.greaterThan(0);
      // Mafia still carries most of the payout since they are heavily favoured,
      // but should not be exactly 120 — the floor shaves a few points off the dominant side.
      pointsWonByFactions.Mafia.should.be.lessThan(120);
    });

    it("should reward a 1/21 village win after a 20-game mafia streak with a small but non-zero payout", function () {
      // Snapshot of stats immediately after the villager's first-ever win is recorded.
      const alignmentWinRates = {
        Village: Array(20).fill(["ranked", false]).concat([["ranked", true]]),
        Mafia: Array(20).fill(["ranked", true]).concat([["ranked", false]]),
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia"],
          alignmentWinRates,
        });
      // Village ~4.8% winrate → still small but > 0. Mafia ~95.2% → near full.
      pointsWonByFactions.Village.should.be.greaterThan(0);
      pointsWonByFactions.Village.should.be.lessThan(20);
      pointsWonByFactions.Mafia.should.be.greaterThan(100);
      // Losing is the expected outcome for village in this setup, so the penalty should not be zero for them.
      pointsLostByFactions.Village.should.be.greaterThan(100);
      pointsLostByFactions.Mafia.should.be.greaterThan(0);
    });

    it("should handle Village 60% vs Mafia 40% win rate", function () {
      // Village 6/10 = 0.6, Mafia 4/10 = 0.4 → weights 0.6, 0.4
      const alignmentWinRates = {
        Village: Array(4).fill(["ranked", true]).concat(Array(2).fill(["competitive", true])).concat(Array(2).fill(["ranked", false])).concat(Array(2).fill(["competitive", false])),
        Mafia: Array(2).fill(["competitive", true]).concat(Array(2).fill(["ranked", true])).concat(Array(3).fill(["ranked", false])).concat(Array(3).fill(["competitive", false])),
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia"],
          alignmentWinRates,
        });
      // weights: V=0.6, M=0.4 → winPts: V=72, M=48 → lossPts: V=48, M=72
      pointsWonByFactions.Village.should.equal(72);
      pointsWonByFactions.Mafia.should.equal(48);
      pointsLostByFactions.Village.should.equal(48);
      pointsLostByFactions.Mafia.should.equal(72);
    });

    it("should handle Village 80% vs Mafia 20% win rate", function () {
      const alignmentWinRates = {
        Village: Array(5).fill(["ranked", true]).concat(Array(3).fill(["competitive", true])).concat(Array(1).fill(["competitive", false])).concat(Array(1).fill(["ranked", false])),
        Mafia: Array(1).fill(["competitive", true]).concat(Array(1).fill(["ranked", true])).concat(Array(4).fill(["ranked", false])).concat(Array(4).fill(["competitive", false])),
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia"],
          alignmentWinRates,
        });
      // weights: V=0.8, M=0.2 → winPts: V=96, M=24 → lossPts: V=24, M=96
      pointsWonByFactions.Village.should.equal(96);
      pointsWonByFactions.Mafia.should.equal(24);
      pointsLostByFactions.Village.should.equal(24);
      pointsLostByFactions.Mafia.should.equal(96);
    });

    it("should handle Village 100% vs Mafia 0% win rate with floor applied to the losing side", function () {
      const alignmentWinRates = {
        Village: Array(3).fill(["ranked", true]).concat(Array(2).fill(["competitive", true])),
        Mafia: Array(2).fill(["competitive", false]).concat(Array(3).fill(["ranked", false])),
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia"],
          alignmentWinRates,
        });
      // Mafia's raw 0% is floored to 0.05; post-normalization V≈0.952, M≈0.048.
      // winPts: V=round(120*0.952)=114, M=round(120*0.048)=6 → lossPts mirror.
      pointsWonByFactions.Village.should.equal(114);
      pointsWonByFactions.Mafia.should.equal(6);
      pointsLostByFactions.Village.should.equal(6);
      pointsLostByFactions.Mafia.should.equal(114);
    });

    it("should handle 3-faction Village 50% / Mafia 30% / Cult 20%", function () {
      const alignmentWinRates = {
        Village: Array(5).fill(["ranked", true]).concat(Array(5).fill(["ranked", false])),
        Mafia: Array(3).fill(["ranked", true]).concat(Array(7).fill(["ranked", false])),
        Cult: Array(2).fill(["ranked", true]).concat(Array(8).fill(["ranked", false])),
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia", "Cult"],
          alignmentWinRates,
        });
      // weights: V=0.5, M=0.3, C=0.2 → winPts: V=60, M=36, C=24
      pointsWonByFactions.Village.should.equal(60);
      pointsWonByFactions.Mafia.should.equal(36);
      pointsWonByFactions.Cult.should.equal(24);
      pointsLostByFactions.Village.should.equal(60);
      pointsLostByFactions.Mafia.should.equal(84);
      pointsLostByFactions.Cult.should.equal(96);
    });

    it("should handle 3-faction equal win rates", function () {
      const alignmentWinRates = {
        Village: Array(5).fill(["ranked", true]).concat(Array(5).fill(["ranked", false])),
        Mafia: Array(5).fill(["ranked", true]).concat(Array(5).fill(["ranked", false])),
        Cult: Array(5).fill(["ranked", true]).concat(Array(5).fill(["ranked", false])),
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia", "Cult"],
          alignmentWinRates,
        });
      pointsWonByFactions.Village.should.equal(40);
      pointsWonByFactions.Mafia.should.equal(40);
      pointsWonByFactions.Cult.should.equal(40);
      pointsLostByFactions.Village.should.equal(80);
      pointsLostByFactions.Mafia.should.equal(80);
      pointsLostByFactions.Cult.should.equal(80);
    });

    it("should handle 3-faction Village 70% / Mafia 20% / Cult 10%", function () {
      const alignmentWinRates = {
        Village: Array(7).fill(["ranked", true]).concat(Array(3).fill(["ranked", false])),
        Mafia: Array(2).fill(["ranked", true]).concat(Array(8).fill(["ranked", false])),
        Cult: Array(1).fill(["ranked", true]).concat(Array(9).fill(["ranked", false])),
      };
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia", "Cult"],
          alignmentWinRates,
        });
      // weights: V=0.7, M=0.2, C=0.1 → winPts: V=84, M=24, C=12
      pointsWonByFactions.Village.should.equal(84);
      pointsWonByFactions.Mafia.should.equal(24);
      pointsWonByFactions.Cult.should.equal(12);
      pointsLostByFactions.Village.should.equal(36);
      pointsLostByFactions.Mafia.should.equal(96);
      pointsLostByFactions.Cult.should.equal(108);
    });

    it("should handle Village + Mafia + Serial Killer with independent cap", function () {
      const alignmentWinRates = {
        Village: Array(3).fill(["ranked", true]).concat(Array(3).fill(["competitive", true])).concat(Array(4).fill(["ranked", false])),
        Mafia: Array(2).fill(["competitive", true]).concat(Array(1).fill(["ranked", true])).concat(Array(4).fill(["competitive", false])).concat(Array(3).fill(["ranked", false])),
        "Serial Killer": Array(1).fill(["competitive", true]).concat(Array(5).fill(["ranked", false])).concat(Array(4).fill(["competitive", false])),
      };
      const { pointsWonByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia", "Serial Killer"],
          alignmentWinRates,
        });
      // weights: V=0.6, M=0.3, SK=0.1 → winPts: V=72, M=36, SK=12 (under cap)
      pointsWonByFactions.Village.should.equal(72);
      pointsWonByFactions.Mafia.should.equal(36);
      pointsWonByFactions["Serial Killer"].should.equal(12);
    });

    it("should handle one faction with no ranked data falling back to avg of others", function () {
      const alignmentWinRates = {
        Village: Array(8).fill(["ranked", true]).concat(Array(2).fill(["ranked", false])),
        Mafia: Array(2).fill(["ranked", true]).concat(Array(8).fill(["ranked", false])),
        Cult: [["unranked", true]], // no ranked data
      };
      const { pointsWonByFactions } =
        computeFactionFortunePoints({
          factionNames: ["Village", "Mafia", "Cult"],
          alignmentWinRates,
        });
      // V=0.8, M=0.2, Cult=null → fill = (0.8+0.2)/2 = 0.5
      // sum = 0.8+0.2+0.5 = 1.5 → weights: V=0.533, M=0.133, C=0.333
      // winPts: V=round(64), M=round(16), C=round(40)
      pointsWonByFactions.Village.should.equal(64);
      pointsWonByFactions.Mafia.should.equal(16);
      pointsWonByFactions.Cult.should.equal(40);
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
      // Only the ranked rows count: Village 1/1, Mafia 0/1. Mafia's 0 is floored to 0.05.
      pointsWonByFactions.Village.should.equal(114);
      pointsWonByFactions.Mafia.should.equal(6);
    });
  });
});
