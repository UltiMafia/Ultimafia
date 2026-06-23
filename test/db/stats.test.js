const chai = require("chai"),
  should = chai.should();
const dbStats = require("../../db/stats");

describe("db/stats", function () {
  describe("ensureStatsObj", function () {
    it("fills missing wins/abandons on partial buckets", function () {
      const partial = { totalGames: 3 };
      dbStats.ensureStatsObj(partial, "Mafia");

      partial.totalGames.should.equal(3);
      partial.wins.count.should.equal(0);
      partial.wins.total.should.equal(0);
      partial.abandons.count.should.equal(0);
      partial.abandons.total.should.equal(0);
      partial.bySetup.should.be.an("object");
    });
  });

  describe("normalizeUserStats", function () {
    it("migrates legacy top-level maps into all bucket", function () {
      const stats = {
        Mafia: {
          all: {
            totalGames: 10,
            wins: { count: 5, total: 10 },
            abandons: { count: 0, total: 0 },
          },
          byRole: {
            Cop: { totalGames: 2 },
          },
        },
      };

      dbStats.normalizeUserStats(stats);

      stats.Mafia.all.byRole.Cop.totalGames.should.equal(2);
      stats.Mafia.all.byRole.Cop.wins.total.should.equal(0);
      should.not.exist(stats.Mafia.byRole);
    });
  });

  describe("getWinRateUpdates", function () {
    it("computes ranked and unranked win rates from stats tree", function () {
      const updates = dbStats.getWinRateUpdates({
        Mafia: {
          all: { wins: { count: 3, total: 10 } },
          unranked: { wins: { count: 1, total: 4 } },
        },
      });

      updates.winRate.should.equal(0.3);
      updates.unrankedWinRate.should.equal(0.25);
    });
  });

  describe("buildNumericIncrements", function () {
    it("diffs nested numeric stat fields", function () {
      const before = {};
      const after = {
        Mafia: {
          all: {
            totalGames: 1,
            wins: { count: 1, total: 1 },
          },
        },
      };

      const inc = dbStats.buildNumericIncrements(before, after, "stats");
      inc["stats.Mafia.all.totalGames"].should.equal(1);
      inc["stats.Mafia.all.wins.count"].should.equal(1);
      inc["stats.Mafia.all.wins.total"].should.equal(1);
    });
  });
});
