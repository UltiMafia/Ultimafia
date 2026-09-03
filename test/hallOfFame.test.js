const chai = require("chai");
const should = chai.should();

// modules/redis opens a real connection at require time, and getLeaderboard
// memoises each (category, page, sort) for 5 minutes -- so without a stand-in the
// second case in this file would read the first one's cached board.
//
// The hook below is installed only for the requires that need it and is torn down
// immediately afterwards. An earlier version left Module.prototype.require patched
// for the rest of the process, so every suite loaded after this one was handed the
// fake redis too, which took test/redis.test.js down with it.
const mockRedisClient = {
  on: () => {},
  select: () => {},
  existsAsync: async () => false,
  getAsync: async () => null,
  setAsync: async () => "OK",
  expire: async () => 1,
  set: () => {},
  cacheUserInfo: async () => {},
};

const Module = require("module");
const originalRequire = Module.prototype.require;

let models;
let hallOfFame;
let MIN_RATED_GAMES;

Module.prototype.require = function (name) {
  if (name === "redis") {
    return { createClient: () => mockRedisClient };
  }
  return originalRequire.apply(this, arguments);
};

try {
  models = require("../db/models");
  hallOfFame = require("../modules/hallOfFame");
  ({ MIN_RATED_GAMES } = require("../modules/skillRating"));
} finally {
  Module.prototype.require = originalRequire;
  // modules/redis is now cached holding the fake client; drop it so anything
  // loaded after this file builds a real one.
  delete require.cache[require.resolve("../modules/redis")];
}

describe("modules/hallOfFame - rated-games barrier", function () {
  let originalUserFind;
  let originalVanityUrlFind;
  let originalTrophyFind;
  let originalStampAggregate;

  before(function () {
    originalUserFind = models.User.find;
    originalVanityUrlFind = models.VanityUrl.find;
    originalTrophyFind = models.Trophy.find;
    originalStampAggregate = models.Stamp.aggregate;

    models.VanityUrl.find = () => ({ select: () => ({ lean: () => [] }) });
    models.Trophy.find = () => ({ select: () => ({ sort: () => ({ lean: () => [] }) }) });
    models.Stamp.aggregate = () => [];
  });

  after(function () {
    models.User.find = originalUserFind;
    models.VanityUrl.find = originalVanityUrlFind;
    models.Trophy.find = originalTrophyFind;
    models.Stamp.aggregate = originalStampAggregate;
  });

  function mockUser(id, gamesPlayed, { mu = 30, sigma = 2, settings = {} } = {}) {
    return {
      id,
      name: id,
      avatar: false,
      avatarVersion: 5,
      deleted: false,
      playedGame: true,
      settings,
      stats: { Mafia: { all: { wins: { count: 5, total: 10 } } } },
      skillRating: { mu, sigma, gamesPlayed, conservativeRank: mu - 3 * sigma },
    };
  }

  function useUsers(users) {
    models.User.find = () => ({ select: () => ({ lean: () => users }) });
  }

  function board(category = "skillRating") {
    return hallOfFame.getLeaderboard({ category, page: 1, pageSize: 10 });
  }

  it("ranks only players at or above the threshold, best conservative rank first", async function () {
    useUsers([
      mockUser("rated", MIN_RATED_GAMES, { mu: 30, sigma: 2 }),      // CR 24
      mockUser("tooFew", MIN_RATED_GAMES - 10, { mu: 40, sigma: 1 }), // CR 37, but under the bar
      mockUser("veteran", 50, { mu: 20, sigma: 3 }),                  // CR 11
    ]);

    const result = await board();

    result.total.should.equal(2);
    result.users.map((u) => u.userId).should.deep.equal(["rated", "veteran"]);
    result.users[0].rank.should.equal(1);
    result.users[1].rank.should.equal(2);
    result.users.some((u) => u.userId === "tooFew").should.be.false;
  });

  it("treats the threshold as inclusive", async function () {
    useUsers([
      mockUser("justUnder", MIN_RATED_GAMES - 1),
      mockUser("exactly", MIN_RATED_GAMES),
    ]);

    const result = await board();

    result.total.should.equal(1);
    result.users[0].userId.should.equal("exactly");
  });

  it("reports the threshold it applied", async function () {
    useUsers([mockUser("rated", MIN_RATED_GAMES)]);

    const result = await board();

    result.filters.minRatedGames.should.equal(MIN_RATED_GAMES);
  });

  it("nulls skill fields for under-threshold players in other categories", async function () {
    useUsers([
      mockUser("rated", MIN_RATED_GAMES, { mu: 30, sigma: 2 }),
      mockUser("tooFew", MIN_RATED_GAMES - 10, { mu: 40, sigma: 1 }),
    ]);

    const result = await board("loot");
    result.users.should.have.lengthOf(2);

    const rated = result.users.find((u) => u.userId === "rated");
    const tooFew = result.users.find((u) => u.userId === "tooFew");

    rated.skillGamesPlayed.should.equal(MIN_RATED_GAMES);
    rated.skillTier.should.not.equal("Unranked");
    should.exist(rated.skillRating);

    // null, not 0 -- 0 is a legitimate conservative rank for a default-rated player.
    should.equal(tooFew.skillRating, null);
    should.equal(tooFew.skillMu, null);
    should.equal(tooFew.skillSigma, null);
    tooFew.skillTier.should.equal("Unranked");
  });

  it("carries avatarVersion through to board rows", async function () {
    useUsers([mockUser("rated", MIN_RATED_GAMES)]);

    const result = await board();

    result.users[0].avatarVersion.should.equal(5);
  });

  it("defaults avatarVersion to 0 when absent", async function () {
    useUsers([{ ...mockUser("legacy", MIN_RATED_GAMES), avatarVersion: undefined }]);

    const result = await board();

    result.users[0].avatarVersion.should.equal(0);
  });

  it("leaves players who hide their statistics off the rating leaderboard", async function () {
    useUsers([
      mockUser("open", MIN_RATED_GAMES, { mu: 30, sigma: 2 }),
      mockUser("private", MIN_RATED_GAMES, { mu: 40, sigma: 1, settings: { hideStatistics: true } }),
    ]);

    const result = await board();

    result.total.should.equal(1);
    result.users[0].userId.should.equal("open");
  });

  it("redacts hidden statistics and karma in other categories", async function () {
    useUsers([
      mockUser("private", MIN_RATED_GAMES, { settings: { hideStatistics: true } }),
      mockUser("noKarma", MIN_RATED_GAMES, { settings: { hideKarma: true } }),
    ]);

    const result = await board("loot");

    const priv = result.users.find((u) => u.userId === "private");
    should.equal(priv.skillRating, null);
    should.equal(priv.skillTier, null);
    should.equal(priv.skillGamesPlayed, null);
    should.equal(priv.wins, null);
    should.equal(priv.losses, null);
    should.equal(priv.winRate, null);

    const noKarma = result.users.find((u) => u.userId === "noKarma");
    should.equal(noKarma.karma, null);
    should.exist(noKarma.wins);
  });
});
