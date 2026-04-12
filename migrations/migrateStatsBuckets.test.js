const chai = require("chai"),
  assert = chai.assert,
  should = chai.should();
const { migrateUserStats } = require("./migrateStatsBuckets");

describe("migrations/migrateStatsBuckets", function () {
  describe("migrateUserStats", function () {
    /*
     * Example: full before/after snapshot of a legacy user's stats.
     *
     * BEFORE (legacy — all ranked+comp, maps at top level):
     * {
     *   Mafia: {
     *     all: { totalGames: 10, wins: { count: 5, total: 10 }, abandons: { count: 0, total: 0 } },
     *     bySetup: { setup1: { totalGames: 3, wins: { count: 2, total: 3 }, abandons: { count: 0, total: 0 } } },
     *     byRole: { Cop: { totalGames: 4, wins: { count: 2, total: 4 }, abandons: { count: 0, total: 0 } } },
     *     byAlignment: { Village: { totalGames: 6, wins: { count: 3, total: 6 }, abandons: { count: 0, total: 0 } } },
     *   }
     * }
     *
     * AFTER (migrated — maps nested inside the all bucket, top-level maps removed):
     * {
     *   Mafia: {
     *     all: {
     *       totalGames: 10, wins: { count: 5, total: 10 }, abandons: { count: 0, total: 0 },
     *       bySetup: { setup1: { totalGames: 3, wins: { count: 2, total: 3 }, abandons: { count: 0, total: 0 } } },
     *       byRole: { Cop: { totalGames: 4, wins: { count: 2, total: 4 }, abandons: { count: 0, total: 0 } } },
     *       byAlignment: { Village: { totalGames: 6, wins: { count: 3, total: 6 }, abandons: { count: 0, total: 0 } } },
     *     }
     *   }
     * }
     */
    it("should move legacy bySetup/byRole/byAlignment into all bucket", function () {
      const stats = {
        Mafia: {
          all: { totalGames: 10, wins: { count: 5, total: 10 }, abandons: { count: 0, total: 0 } },
          bySetup: { setup1: { totalGames: 3, wins: { count: 2, total: 3 }, abandons: { count: 0, total: 0 } } },
          byRole: { Cop: { totalGames: 4, wins: { count: 2, total: 4 }, abandons: { count: 0, total: 0 } } },
          byAlignment: { Village: { totalGames: 6, wins: { count: 3, total: 6 }, abandons: { count: 0, total: 0 } } },
        },
      };

      migrateUserStats(stats).should.equal(true);

      stats.Mafia.all.bySetup.setup1.totalGames.should.equal(3);
      stats.Mafia.all.byRole.Cop.totalGames.should.equal(4);
      stats.Mafia.all.byAlignment.Village.totalGames.should.equal(6);

      should.not.exist(stats.Mafia.bySetup);
      should.not.exist(stats.Mafia.byRole);
      should.not.exist(stats.Mafia.byAlignment);
    });

    it("should not overwrite existing data in all bucket", function () {
      const stats = {
        Mafia: {
          all: {
            totalGames: 10, wins: { count: 5, total: 10 }, abandons: { count: 0, total: 0 },
            byRole: { Cop: { totalGames: 7, wins: { count: 5, total: 7 }, abandons: { count: 0, total: 0 } } },
          },
          byRole: {
            Cop: { totalGames: 2, wins: { count: 1, total: 2 }, abandons: { count: 0, total: 0 } },
            Mafioso: { totalGames: 3, wins: { count: 1, total: 3 }, abandons: { count: 0, total: 0 } },
          },
        },
      };

      migrateUserStats(stats).should.equal(true);

      // Cop already existed in all.byRole — should keep the existing data
      stats.Mafia.all.byRole.Cop.totalGames.should.equal(7);
      // Mafioso was only in legacy — should be moved
      stats.Mafia.all.byRole.Mafioso.totalGames.should.equal(3);

      should.not.exist(stats.Mafia.byRole);
    });

    it("should return false when no legacy maps exist", function () {
      const stats = {
        Mafia: {
          all: {
            totalGames: 5, wins: { count: 3, total: 5 }, abandons: { count: 0, total: 0 },
            bySetup: {}, byRole: {}, byAlignment: {},
          },
          unranked: {
            totalGames: 2, wins: { count: 1, total: 2 }, abandons: { count: 0, total: 0 },
            bySetup: {}, byRole: {}, byAlignment: {},
          },
        },
      };

      migrateUserStats(stats).should.equal(false);
    });

    it("should handle null/undefined stats", function () {
      migrateUserStats(null).should.equal(false);
      migrateUserStats(undefined).should.equal(false);
    });

    it("should handle empty legacy maps by deleting them", function () {
      const stats = {
        Mafia: {
          all: { totalGames: 0, wins: { count: 0, total: 0 }, abandons: { count: 0, total: 0 } },
          bySetup: {},
          byRole: {},
          byAlignment: {},
        },
      };

      migrateUserStats(stats).should.equal(true);

      should.not.exist(stats.Mafia.bySetup);
      should.not.exist(stats.Mafia.byRole);
      should.not.exist(stats.Mafia.byAlignment);
    });

    it("should handle missing all bucket gracefully", function () {
      const stats = {
        Mafia: {
          bySetup: { setup1: { totalGames: 1 } },
        },
      };

      migrateUserStats(stats).should.equal(false);
      // Legacy data stays since there's no all bucket to migrate into
      stats.Mafia.bySetup.setup1.totalGames.should.equal(1);
    });

    it("should handle stats with no Mafia key", function () {
      const stats = {};
      migrateUserStats(stats).should.equal(false);
    });

    it("should only migrate maps, not scalar fields", function () {
      const stats = {
        Mafia: {
          all: { totalGames: 5, wins: { count: 3, total: 5 }, abandons: { count: 0, total: 0 } },
          byRole: { Doc: { totalGames: 2, wins: { count: 1, total: 2 }, abandons: { count: 0, total: 0 } } },
        },
      };

      migrateUserStats(stats).should.equal(true);

      // all's own fields should be untouched
      stats.Mafia.all.totalGames.should.equal(5);
      stats.Mafia.all.wins.count.should.equal(3);
      stats.Mafia.all.byRole.Doc.totalGames.should.equal(2);
    });

    it("should migrate multiple game types independently", function () {
      const stats = {
        Mafia: {
          all: { totalGames: 5, wins: { count: 3, total: 5 }, abandons: { count: 0, total: 0 } },
          byRole: { Cop: { totalGames: 2 } },
        },
        Resistance: {
          all: { totalGames: 3, wins: { count: 1, total: 3 }, abandons: { count: 0, total: 0 } },
          byRole: { Spy: { totalGames: 1 } },
        },
      };

      migrateUserStats(stats).should.equal(true);

      stats.Mafia.all.byRole.Cop.totalGames.should.equal(2);
      stats.Resistance.all.byRole.Spy.totalGames.should.equal(1);
      should.not.exist(stats.Mafia.byRole);
      should.not.exist(stats.Resistance.byRole);
    });
  });
});
