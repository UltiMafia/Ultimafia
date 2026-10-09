const chai = require("chai");
const should = chai.should();
const Game = require("../../Games/core/Game");
const ArrayHash = require("../../Games/core/ArrayHash");
const models = require("../../db/models");
const redis = require("../../modules/redis");
const skillRating = require("../../modules/skillRating");
const stockMarket = require("../../lib/StockMarket");

// A game with a bot in it must not change anyone's score. These tests drive
// the real Game methods on a stub game, with the db/redis calls swapped for
// recorders, so no database is needed.

function stubGame({ ranked = true, competitive = false, bot = false } = {}) {
  const mk = (id, won) => ({
    id,
    name: id.toUpperCase(),
    won,
    user: { id: `u-${id}`, achievements: [], dailyChallenges: [] },
    EarnedAchievements: ["Mafia1"],
    left: false,
  });
  const list = [mk("t1", true), mk("t2", true), mk("m1", false)];
  if (bot) {
    list[2].isBot = true;
    list[2].user = { id: "bot-m1", dev: true, achievements: [] };
  }
  const players = new ArrayHash();
  for (const p of list) players.push(p);

  const calls = { setupStats: 0, competitive: 0 };
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    id: "g1",
    type: "Mafia",
    ranked,
    competitive,
    private: false,
    hasIntegrity: true,
    hadVegKill: false,
    players,
    playersGone: {},
    spectatorsOld: [],
    setup: { id: "s1", version: 1 },
    originalRoles: Object.fromEntries(list.map((p) => [p.id, "Villager"])),
    // Fortune already computed (as if adjustSkillRatings had run).
    pointsEarnedByPlayers: { t1: 40, t2: 40, m1: 0 },
    winners: {
      players: list.filter((p) => p.won),
      getWinnersInfo: () => ({ groups: ["Village"], players: ["t1", "t2"] }),
    },
    history: { getHistoryInfo: () => ({}) },
    stateLengths: {},
    getGameTypeOptions: () => ({}),
    getRoleAlignment: () => "Village",
    getAchievementReward: () => 5,
    buildStatsIncrements: (p) => ({ [`stats.Mafia.all.wins.count`]: 1 }),
    recordSetupStats() {
      calls.setupStats++;
    },
    async recordCompetitiveCompletions() {
      calls.competitive++;
    },
    async finalizePostgameCleanup() {},
  });
  return { game, calls };
}

describe("Bot games don't affect rankings", function () {
  const saved = {};
  let rec;

  beforeEach(function () {
    rec = { games: [], userUpdates: [], ratings: 0, dividends: 0 };
    const query = (v) => ({
      lean: async () => v,
      exec: async () => v,
      then: (ok, bad) => Promise.resolve(v).then(ok, bad),
    });
    const chain = (v) => ({ select: () => query(v), exec: async () => v });
    saved.models = { ...models };
    saved.cacheUserInfo = redis.cacheUserInfo;
    saved.updateGameRatings = skillRating.updateGameRatings;
    saved.distributeDividends = stockMarket.distributeDividends;

    models.Setup = { findOne: () => chain({ _id: "setupOid" }) };
    models.User = {
      findOne: () => chain(null),
      updateOne: (q, u) => {
        rec.userUpdates.push({ id: q.id, ...u });
        return { exec: async () => ({}) };
      },
    };
    models.Game = class {
      constructor(doc) {
        Object.assign(this, doc);
        this._id = "gameOid";
      }
      async save() {
        rec.games.push(this);
        return this;
      }
    };
    models.HeartRefresh = class {
      static findOne() {
        return chain({ _id: "x" });
      }
    };
    models.DailyChallengeRefresh = class {
      static findOne() {
        return chain({ _id: "x" });
      }
    };
    redis.cacheUserInfo = async () => {};
    skillRating.updateGameRatings = async () => {
      rec.ratings++;
    };
    stockMarket.distributeDividends = async () => {
      rec.dividends++;
    };
  });

  afterEach(function () {
    Object.assign(models, saved.models);
    redis.cacheUserInfo = saved.cacheUserInfo;
    skillRating.updateGameRatings = saved.updateGameRatings;
    stockMarket.distributeDividends = saved.distributeDividends;
  });

  const incFor = (id) =>
    rec.userUpdates.find((u) => u.id === id && u.$inc && "points" in u.$inc);

  it("countsForRankings is false once any bot was seated", function () {
    const { game } = stubGame();
    game.countsForRankings().should.equal(true);
    game.achievementsAllowed().should.equal(true);

    const withBot = stubGame({ bot: true }).game;
    withBot.countsForRankings().should.equal(false);
    withBot.achievementsAllowed().should.equal(false);

    // Sticky: a bot that left still makes it a bot game.
    game.hadBots = true;
    game.countsForRankings().should.equal(false);
  });

  it("a ranked game without bots still updates ratings, points, stats and rewards", async function () {
    const { game, calls } = stubGame();
    await game._doEndPostgame();

    rec.ratings.should.equal(1);
    calls.setupStats.should.equal(1);
    rec.games.should.have.length(1);
    rec.games[0].hadBots.should.equal(false);

    const t1 = incFor("u-t1");
    t1.$inc.points.should.equal(40);
    t1.$inc.coins.should.equal(1 + 5); // ranked win + achievement
    t1.$inc["stats.Mafia.all.wins.count"].should.equal(1);
    t1.$addToSet.achievements.$each.should.deep.equal(["Mafia1"]);
  });

  it("a ranked game with a bot saves the record but changes no score", async function () {
    const { game, calls } = stubGame({ bot: true });
    await game._doEndPostgame();

    rec.ratings.should.equal(0);
    calls.setupStats.should.equal(0);
    rec.dividends.should.equal(0);
    rec.games.should.have.length(1);
    rec.games[0].hadBots.should.equal(true);
    rec.games[0].ranked.should.equal(true);

    for (const id of ["u-t1", "u-t2"]) {
      const u = incFor(id);
      u.$inc.points.should.equal(0);
      u.$inc.pointsNegative.should.equal(0);
      u.$inc.coins.should.equal(0);
      u.$inc.kudos.should.equal(0);
      Object.keys(u.$inc)
        .filter((k) => k.startsWith("stats."))
        .should.have.length(0);
      u.$addToSet.achievements.$each.should.deep.equal([]);
      u.$push.games.should.equal("gameOid");
    }
  });

  it("a competitive game with a bot skips competitive scoring", async function () {
    const { game, calls } = stubGame({
      ranked: false,
      competitive: true,
      bot: true,
    });
    await game._doEndPostgame();
    calls.competitive.should.equal(0);
    rec.ratings.should.equal(0);

    const clean = stubGame({ ranked: false, competitive: true });
    await clean.game._doEndPostgame();
    clean.calls.competitive.should.equal(1);
  });

  it("skill rating never moves for a saved game marked hadBots", async function () {
    skillRating.updateGameRatings = saved.updateGameRatings;
    models.User = {
      find: () => {
        throw new Error("should not load users for a bot game");
      },
    };
    await skillRating.updateGameRatings({
      ranked: true,
      hadBots: true,
      playerIdMap: JSON.stringify({ a: "p1", b: "p2" }),
      winners: ["p1"],
    });
  });
});
