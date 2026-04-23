const chai = require("chai"),
  assert = chai.assert,
  should = chai.should();
const {
  winRateFromAlignmentEntries,
  alignmentRowsToWinRateMap,
  isMajorFaction,
  computeFactionFortunePoints,
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

    it("should aggregate ranked and competitive rows together", function () {
      const entries = [
        ["ranked", true],
        ["ranked", true],
        ["competitive", false],
        ["competitive", false],
      ];
      winRateFromAlignmentEntries(entries).should.equal(0.5);
    });

    it("should return null when only unranked rows exist", function () {
      const result = winRateFromAlignmentEntries([
        ["unranked", true],
        ["unranked", false],
      ]);
      (result === null).should.be.true;
    });

    it("should return null for empty or missing input", function () {
      (winRateFromAlignmentEntries([]) === null).should.be.true;
      (winRateFromAlignmentEntries(null) === null).should.be.true;
      (winRateFromAlignmentEntries(undefined) === null).should.be.true;
    });
  });

  describe("alignmentRowsToWinRateMap", function () {
    it("should group alignmentRows by faction key as [gameType, won] pairs", function () {
      const map = alignmentRowsToWinRateMap({
        alignmentRows: [
          ["Village", "ranked", true],
          ["Mafia", "ranked", false],
          ["Village", "competitive", false],
        ],
      });
      map.Village.length.should.equal(2);
      map.Mafia.length.should.equal(1);
      map.Village[0].should.deep.equal(["ranked", true]);
    });

    it("should return empty map for null / missing setupStats", function () {
      Object.keys(alignmentRowsToWinRateMap(null)).length.should.equal(0);
      Object.keys(alignmentRowsToWinRateMap(undefined)).length.should.equal(0);
      Object.keys(alignmentRowsToWinRateMap({})).length.should.equal(0);
    });
  });

  describe("isMajorFaction", function () {
    it("should recognise Village, Mafia, Cult as major", function () {
      isMajorFaction("Village").should.be.true;
      isMajorFaction("Mafia").should.be.true;
      isMajorFaction("Cult").should.be.true;
    });

    it("should recognise *Mafia variants (e.g. RedMafia) as major", function () {
      isMajorFaction("RedMafia").should.be.true;
      isMajorFaction("BlueMafia").should.be.true;
    });

    it("should treat independents as non-major", function () {
      isMajorFaction("Jester").should.be.false;
      isMajorFaction("Serial Killer").should.be.false;
      isMajorFaction("Hunter").should.be.false;
    });
  });

  // Spec for the payout formula:
  //   Major factions (Village / Mafia / Cult / *Mafia):
  //     solo:  (1 - wr) * K                     (K defaults to 120)
  //     joint: solo * 0.9
  //   Independents:
  //     solo:  min(120, sqrt(0.10 / wr) * 80)   (0.10 = anchor WR, 80 = anchor payout)
  //     joint: solo * 0.7
  //   Misfortune scrapped — losers always earn 0.

  describe("computeFactionFortunePoints - major faction solo wins", function () {
    function winratesFor(map) {
      const out = {};
      for (const [f, rate] of Object.entries(map)) {
        // Build ranked rows that yield the target rate at the smallest sample.
        const denom = 10;
        const wins = Math.round(rate * denom);
        const losses = denom - wins;
        out[f] = [];
        for (let i = 0; i < wins; i++) out[f].push(["ranked", true]);
        for (let i = 0; i < losses; i++) out[f].push(["ranked", false]);
      }
      return out;
    }

    it("should pay 96 to Village winning solo at 20% historical WR", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: ["Village"],
        alignmentWinRates: winratesFor({ Village: 0.2, Mafia: 0.4 }),
      });
      pointsWonByFactions.Village.should.equal(96);
    });

    it("should pay 72 to Mafia winning solo at 40% historical WR", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: ["Mafia"],
        alignmentWinRates: winratesFor({ Village: 0.2, Mafia: 0.4 }),
      });
      pointsWonByFactions.Mafia.should.equal(72);
    });

    it("should pay 96 to Cult winning solo at 20% historical WR", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Cult"],
        winningFactions: ["Cult"],
        alignmentWinRates: winratesFor({ Village: 0.2, Mafia: 0.4, Cult: 0.2 }),
      });
      pointsWonByFactions.Cult.should.equal(96);
    });

    it("should pay 60 when historical WR is 50% (balanced)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: ["Village"],
        alignmentWinRates: winratesFor({ Village: 0.5, Mafia: 0.5 }),
      });
      pointsWonByFactions.Village.should.equal(60);
    });

    it("should pay the full K=120 when a major has never won historically", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: ["Village"],
        alignmentWinRates: winratesFor({ Village: 0, Mafia: 1 }),
      });
      pointsWonByFactions.Village.should.equal(120);
    });

    it("should pay 0 when a major has always won historically (expected outcome)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: ["Mafia"],
        alignmentWinRates: winratesFor({ Village: 0, Mafia: 1 }),
      });
      pointsWonByFactions.Mafia.should.equal(0);
    });

    it("should treat RedMafia like other majors", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "RedMafia"],
        winningFactions: ["RedMafia"],
        alignmentWinRates: winratesFor({ Village: 0.8, RedMafia: 0.2 }),
      });
      pointsWonByFactions.RedMafia.should.equal(96);
    });

    it("should respect a custom K override", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: ["Village"],
        alignmentWinRates: winratesFor({ Village: 0.2, Mafia: 0.4 }),
        K: 200,
      });
      // (1 - 0.2) * 200 = 160
      pointsWonByFactions.Village.should.equal(160);
    });
  });

  describe("computeFactionFortunePoints - major faction joint wins", function () {
    function winratesFor(map) {
      const out = {};
      for (const [f, rate] of Object.entries(map)) {
        const denom = 10;
        const wins = Math.round(rate * denom);
        out[f] = [];
        for (let i = 0; i < wins; i++) out[f].push(["ranked", true]);
        for (let i = 0; i < denom - wins; i++) out[f].push(["ranked", false]);
      }
      return out;
    }

    it("should dampen Mafia's solo payout by 0.9 when Cult co-wins", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Cult"],
        winningFactions: ["Mafia", "Cult"],
        alignmentWinRates: winratesFor({ Village: 0.4, Mafia: 0.4, Cult: 0.2 }),
      });
      // Mafia solo would be 72; joint damp 0.9 → 64.8 → round to 65.
      pointsWonByFactions.Mafia.should.equal(65);
    });

    it("should dampen Cult's solo payout by 0.9 when Mafia co-wins", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Cult"],
        winningFactions: ["Mafia", "Cult"],
        alignmentWinRates: winratesFor({ Village: 0.4, Mafia: 0.4, Cult: 0.2 }),
      });
      // Cult solo would be 96; joint damp 0.9 → 86.4 → round to 86.
      pointsWonByFactions.Cult.should.equal(86);
    });

    it("should apply the major damp to both sides of a balanced Mafia/Cult joint", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Cult"],
        winningFactions: ["Mafia", "Cult"],
        alignmentWinRates: winratesFor({ Village: 0.5, Mafia: 0.5, Cult: 0.5 }),
      });
      // Solo would be 60 each; joint damp 0.9 → 54.
      pointsWonByFactions.Mafia.should.equal(54);
      pointsWonByFactions.Cult.should.equal(54);
    });
  });

  describe("computeFactionFortunePoints - independent solo wins", function () {
    // Helper that builds an alignmentRows-like input for a target independent WR.
    function indepWinrates(faction, rate, denom = 100) {
      const wins = Math.round(rate * denom);
      const rows = [];
      for (let i = 0; i < wins; i++) rows.push(["ranked", true]);
      for (let i = 0; i < denom - wins; i++) rows.push(["ranked", false]);
      return { [faction]: rows };
    }

    it("should pay exactly the anchor payout (80) at the anchor winrate (10%)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Jester"],
        winningFactions: ["Jester"],
        alignmentWinRates: indepWinrates("Jester", 0.10),
      });
      pointsWonByFactions.Jester.should.equal(80);
    });

    it("should pay more than the anchor below the anchor winrate (5% → ~113)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Jester"],
        winningFactions: ["Jester"],
        alignmentWinRates: indepWinrates("Jester", 0.05),
      });
      // sqrt(0.10 / 0.05) * 80 = sqrt(2) * 80 ≈ 113.14
      pointsWonByFactions.Jester.should.equal(113);
    });

    it("should cap at 120 when the formula would pay more (1% WR)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Jester"],
        winningFactions: ["Jester"],
        alignmentWinRates: indepWinrates("Jester", 0.01),
      });
      // sqrt(10)*80 ≈ 253 → capped to 120.
      pointsWonByFactions.Jester.should.equal(120);
    });

    it("should cap at 120 for a 0% WR independent (would be infinity)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Jester"],
        winningFactions: ["Jester"],
        alignmentWinRates: indepWinrates("Jester", 0),
      });
      pointsWonByFactions.Jester.should.equal(120);
    });

    it("should pay less than the anchor above the anchor winrate (20% → ~57)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Jester"],
        winningFactions: ["Jester"],
        alignmentWinRates: indepWinrates("Jester", 0.20),
      });
      // sqrt(0.5)*80 ≈ 56.57 → 57.
      pointsWonByFactions.Jester.should.equal(57);
    });

    it("should pay ~25 for an always-winning independent (100%)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Jester"],
        winningFactions: ["Jester"],
        alignmentWinRates: indepWinrates("Jester", 1),
      });
      // sqrt(0.1)*80 ≈ 25.30 → 25.
      pointsWonByFactions.Jester.should.equal(25);
    });
  });

  describe("computeFactionFortunePoints - independent joint wins", function () {
    function indepWinrates(faction, rate, denom = 100) {
      const wins = Math.round(rate * denom);
      const rows = [];
      for (let i = 0; i < wins; i++) rows.push(["ranked", true]);
      for (let i = 0; i < denom - wins; i++) rows.push(["ranked", false]);
      return { [faction]: rows };
    }

    it("should dampen the anchor payout by 0.7 when the independent shares a joint win", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Jester"],
        winningFactions: ["Mafia", "Jester"],
        alignmentWinRates: indepWinrates("Jester", 0.10),
      });
      // Solo 80 → joint 80 * 0.7 = 56.
      pointsWonByFactions.Jester.should.equal(56);
    });

    it("should apply the cap before the damp (1% WR joint → 84, not 177)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Jester"],
        winningFactions: ["Mafia", "Jester"],
        alignmentWinRates: indepWinrates("Jester", 0.01),
      });
      // Raw would be 253 * 0.7 = 177 if damp applied first; correct is cap→120, then damp→84.
      pointsWonByFactions.Jester.should.equal(84);
    });
  });

  describe("computeFactionFortunePoints - mixed joint wins", function () {
    it("should apply the 0.9 damp to majors and the 0.7 damp to independents in the same game", function () {
      // Mafia 40% solo would be 72; joint damp 0.9 → 64.8 → 65.
      // Jester 5% solo would be ~113.14; joint damp 0.7 → ~79.20 → 79.
      const alignmentWinRates = {
        Mafia: (function () {
          const wins = 4, losses = 6;
          const rows = [];
          for (let i = 0; i < wins; i++) rows.push(["ranked", true]);
          for (let i = 0; i < losses; i++) rows.push(["ranked", false]);
          return rows;
        })(),
        Jester: (function () {
          const wins = 5, losses = 95;
          const rows = [];
          for (let i = 0; i < wins; i++) rows.push(["ranked", true]);
          for (let i = 0; i < losses; i++) rows.push(["ranked", false]);
          return rows;
        })(),
      };
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Jester"],
        winningFactions: ["Mafia", "Jester"],
        alignmentWinRates,
      });
      pointsWonByFactions.Mafia.should.equal(65);
      pointsWonByFactions.Jester.should.equal(79);
    });
  });

  describe("computeFactionFortunePoints - misfortune scrapped", function () {
    it("should return pointsLostByFactions entries of 0 for every faction", function () {
      const { pointsLostByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Cult", "Jester"],
        winningFactions: ["Village"],
        alignmentWinRates: {},
      });
      pointsLostByFactions.Village.should.equal(0);
      pointsLostByFactions.Mafia.should.equal(0);
      pointsLostByFactions.Cult.should.equal(0);
      pointsLostByFactions.Jester.should.equal(0);
    });

    it("should return 0 in pointsWonByFactions for any non-winning faction", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia", "Jester"],
        winningFactions: ["Village"],
        alignmentWinRates: {},
      });
      pointsWonByFactions.Mafia.should.equal(0);
      pointsWonByFactions.Jester.should.equal(0);
    });
  });

  describe("computeFactionFortunePoints - edge cases", function () {
    it("should return empty objects for an empty factionNames list", function () {
      const { pointsWonByFactions, pointsLostByFactions } =
        computeFactionFortunePoints({
          factionNames: [],
          winningFactions: [],
          alignmentWinRates: {},
        });
      Object.keys(pointsWonByFactions).length.should.equal(0);
      Object.keys(pointsLostByFactions).length.should.equal(0);
    });

    it("should award zero to every faction when no one won (broken game safety)", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: [],
        alignmentWinRates: {},
      });
      pointsWonByFactions.Village.should.equal(0);
      pointsWonByFactions.Mafia.should.equal(0);
    });

    it("should use a neutral 50% prior for a major with no historical data", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: ["Village"],
        alignmentWinRates: {},
      });
      // (1 - 0.5) * 120 = 60.
      pointsWonByFactions.Village.should.equal(60);
    });

    it("should use the anchor (10%) as the prior for an independent with no historical data", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Jester"],
        winningFactions: ["Jester"],
        alignmentWinRates: {},
      });
      pointsWonByFactions.Jester.should.equal(80);
    });

    it("should ignore unranked rows when computing winrate", function () {
      const { pointsWonByFactions } = computeFactionFortunePoints({
        factionNames: ["Village", "Mafia"],
        winningFactions: ["Village"],
        alignmentWinRates: {
          // 2/2 unranked wins would imply 100%, but unranked is filtered out.
          // Fall through to the neutral 50% prior.
          Village: [
            ["unranked", true],
            ["unranked", true],
          ],
        },
      });
      pointsWonByFactions.Village.should.equal(60);
    });
  });
});
