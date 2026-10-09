const chai = require("chai");
const should = chai.should();
const Game = require("../../Games/core/Game");
const ArrayHash = require("../../Games/core/ArrayHash");
const models = require("../../db/models");
const redis = require("../../modules/redis");
const skillRating = require("../../modules/skillRating");
const stockMarket = require("../../lib/StockMarket");

// A game with a dev test bot in it must not change anyone's score, cost
// hearts or pay daily challenges. Guests are not bots. These tests drive
// the real Game methods on a stub game, with the db/redis calls swapped for
// recorders, so no database is needed.

function stubGame({
  ranked = true,
  competitive = false,
  bot = false,
  guest = false,
  daily = false,
} = {}) {
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
  if (guest) {
    // Guests join with isBot set too (no account), plus a guestId.
    const p = bot ? list[1] : list[2];
    p.isBot = true;
    p.user = { id: `guest-${p.id}`, guestId: "g1", achievements: [] };
  }
  if (daily) {
    // t1 finished a daily challenge worth 10 (and it was their last one).
    list[0].DailyTracker = [{}];
    list[0].DailyPayout = 10;
    list[0].DailyCompleted = 1;
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
    hadBots: false,
    heartsChargedAtStart: false,
    heartsCharged: null,
    heartsRefundedUserIds: new Set(),
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
  return { game, calls, players };
}

describe("Bot games don't affect rankings", function () {
  const saved = {};
  let rec;

  beforeEach(function () {
    rec = {
      games: [],
      userUpdates: [],
      ratings: 0,
      dividends: 0,
      heartRefreshes: 0,
    };
    function query(v) {
      return {
        lean: async () => v,
        populate: () => query(v),
        exec: async () => v,
        then: (ok, bad) => Promise.resolve(v).then(ok, bad),
      };
    }
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
        return chain(null); // no refill timer running yet
      }
      async save() {
        rec.heartRefreshes++;
      }
    };
    models.DailyChallengeRefresh = class {
      static findOne() {
        return chain({ _id: "x" });
      }
    };
    redis.cacheUserInfo = async () => {};
    saved.refreshUserWinRates = Game.refreshUserWinRates;
    Game.refreshUserWinRates = async () => {};
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
    Game.refreshUserWinRates = saved.refreshUserWinRates;
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
      ...models.User,
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

  const hearts = (id) =>
    rec.userUpdates
      .filter((u) => u.id === id && u.$inc && "redHearts" in u.$inc)
      .reduce(
        (sum, u) => ({
          red: sum.red + u.$inc.redHearts,
          gold: sum.gold + u.$inc.goldHearts,
        }),
        { red: 0, gold: 0 }
      );

  it("charges a red heart at start, but not in a bot game", async function () {
    const clean = stubGame().game;
    await clean.chargeHeartsAtStart();
    hearts("u-t1").should.deep.equal({ red: -1, gold: 0 });
    hearts("u-m1").should.deep.equal({ red: -1, gold: 0 });

    rec.userUpdates = [];
    const botGame = stubGame({ bot: true }).game;
    await botGame.chargeHeartsAtStart();
    rec.userUpdates.should.have.length(0);
    botGame.heartsChargedAtStart.should.equal(false);
  });

  it("refunds hearts once if a bot shows up after the start charge", async function () {
    const { game, players } = stubGame({ competitive: true });
    await game.chargeHeartsAtStart();
    // t2 leaves and is refunded by the integrity break; m1 is the leaver.
    game.heartsRefundedUserIds.add("u-t2");
    players.m1.left = true;

    rec.userUpdates = [];
    await game.refundHeartsForBotGame(); // no bot yet: nothing
    rec.userUpdates.should.have.length(0);

    game.hadBots = true;
    await game.refundHeartsForBotGame();
    await game.refundHeartsForBotGame(); // only once
    hearts("u-t1").should.deep.equal({ red: 1, gold: 1 });
    hearts("u-m1").should.deep.equal({ red: 1, gold: 1 }); // leaver too
    hearts("u-t2").should.deep.equal({ red: 0, gold: 0 }); // already back
  });

  it("a ranked game starts the heart refill timer, a bot game doesn't", async function () {
    await stubGame().game._doEndPostgame();
    rec.heartRefreshes.should.equal(3);

    rec.heartRefreshes = 0;
    await stubGame({ bot: true }).game._doEndPostgame();
    rec.heartRefreshes.should.equal(0);
  });

  it("pays and saves daily challenges, but not in a bot game", async function () {
    const daily = (u) =>
      rec.userUpdates.filter(
        (x) => x.id === u && x.$set && "dailyChallenges" in x.$set
      ).length;

    await stubGame({ ranked: false, daily: true }).game._doEndPostgame();
    incFor("u-t1").$inc.coins.should.equal(10 + 20);
    daily("u-t1").should.equal(1);

    rec.userUpdates = [];
    const { game } = stubGame({ ranked: false, daily: true, bot: true });
    game.dailyChallengesAllowed().should.equal(false);
    await game._doEndPostgame();
    incFor("u-t1").$inc.coins.should.equal(0);
    daily("u-t1").should.equal(0);
  });

  it("an unranked game with a guest is not a bot game and records stats", async function () {
    const { game, calls } = stubGame({ ranked: false, guest: true });
    game.hasTestBots().should.equal(false);
    game.countsForRankings().should.equal(true);
    game.dailyChallengesAllowed().should.equal(true);
    await game._doEndPostgame();
    calls.setupStats.should.equal(1);
    rec.games[0].hadBots.should.equal(false);
    incFor("u-t1").$inc["stats.Mafia.all.wins.count"].should.equal(1);
  });

  it("a game with a guest and a bot is a bot game", function () {
    const { game } = stubGame({ guest: true, bot: true });
    game.hasTestBots().should.equal(true);
    game.countsForRankings().should.equal(false);
  });
});
