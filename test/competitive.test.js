require("dotenv").config();
const chai = require("chai");
const crypto = require("crypto");
const mongoose = require("mongoose");
const schemas = require("../db/schemas");
const constants = require("../data/constants");
const {
  computeStandings,
  getSeasonRules,
} = require("../modules/competitiveRules");

const should = chai.should();

const DAY = 24 * 60 * 60 * 1000;
const START = Date.parse("2026-12-01T00:00:00Z");
// A time `minutes` past the UTC midnight that starts round day `day` (day 1 = START)
const at = (day, minutes = 5) => new Date(START + (day - 1) * DAY + minutes * 60 * 1000);

function connectionUri() {
  const configured = process.env.MONGO_URL;
  if (!configured) throw new Error("MONGO_URL is required for competitive tests.");
  if (/^mongodb(\+srv)?:\/\//.test(configured)) return configured;
  const user = encodeURIComponent(process.env.MONGO_USER || "");
  const password = encodeURIComponent(process.env.MONGO_PW || "");
  const credentials = user || password ? `${user}:${password}@` : "";
  return `mongodb://${credentials}${configured}/?authSource=admin`;
}

// Load modules/competitive.js against an isolated database, with the Redis
// cache and route helpers stubbed out.
function loadCompetitive(models, roundInfoFor) {
  const stubs = {
    "../db/models": models,
    "../modules/redis": {
      invalidateCompRoundCache: async () => {},
      invalidateAllCachedUsers: async () => {},
      getCompRoundInfo: async (season, round) => roundInfoFor(season, round),
    },
    "../routes/utils": { createNotification: async () => {} },
  };
  const previous = {};
  for (const [path, exports] of Object.entries(stubs)) {
    const resolved = require.resolve(path);
    previous[resolved] = require.cache[resolved];
    require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  }
  const competitivePath = require.resolve("../modules/competitive");
  delete require.cache[competitivePath];
  const competitive = require("../modules/competitive");
  return {
    competitive,
    restore() {
      delete require.cache[competitivePath];
      for (const [resolved, cached] of Object.entries(previous)) {
        if (cached) require.cache[resolved] = cached;
        else delete require.cache[resolved];
      }
    },
  };
}

describe("competitive rules", function () {
  it("ranks only players at or above the point minimum, with shared ranks for ties", function () {
    const standings = computeStandings(
      {
        a: { points: 900 },
        b: { points: 700 },
        c: { points: 700 },
        d: { points: 499 },
        e: { points: 120 },
        f: { points: 500 },
      },
      500
    );
    standings.map((s) => [s.userId, s.ranking, s.qualified]).should.deep.equal([
      ["a", 0, true],
      ["b", 1, true],
      ["c", 1, true],
      ["f", 3, true],
      ["d", null, false],
      ["e", null, false],
    ]);
  });

  it("ranks everyone when there is no minimum", function () {
    const standings = computeStandings({ a: { points: 0 }, b: { points: 10 } }, 0);
    standings.map((s) => [s.userId, s.ranking]).should.deep.equal([
      ["b", 0],
      ["a", 1],
    ]);
  });

  it("keeps seasons created before the settings on the old rules", function () {
    getSeasonRules({ number: 11 }).should.deep.equal({
      finishLinePoints: constants.competitiveRoundFortuneHammer,
      minimumPointsToPlace: 0,
    });
    getSeasonRules({ finishLinePoints: 1200, minimumPointsToPlace: 300 }).should.deep.equal({
      finishLinePoints: 1200,
      minimumPointsToPlace: 300,
    });
  });
});

describe("competitive round progression", function () {
  this.timeout(20000);
  let connection, models, loaded, competitive;

  before(async function () {
    const namespace = `competitive_${process.pid}_${crypto.randomBytes(6).toString("hex")}`;
    connection = await mongoose
      .createConnection(connectionUri(), { dbName: namespace, serverSelectionTimeoutMS: 10000 })
      .asPromise();
    models = {};
    for (const name of [
      "User",
      "Trophy",
      "CompetitiveSeason",
      "CompetitiveRound",
      "CompetitiveGameCompletion",
      "CompetitiveSeasonStanding",
    ]) {
      models[name] = connection.model(name, schemas[name]);
    }
    loaded = loadCompetitive(models, roundInfoFor);
    competitive = loaded.competitive;
  });

  after(async function () {
    if (loaded) loaded.restore();
    if (connection) {
      await connection.dropDatabase();
      await connection.close();
    }
  });

  beforeEach(async function () {
    for (const model of Object.values(models)) {
      await model.deleteMany({});
    }
    await models.User.create([
      { id: "alice", name: "alice" },
      { id: "bob", name: "bob" },
    ]);
    await models.CompetitiveSeason.create({
      number: 1,
      startDate: "2026-12-01",
      numRounds: 1,
      setupOrder: [[0]],
      finishLinePoints: 1500,
      minimumPointsToPlace: 500,
    });
  });

  // Mirrors modules/redis.js getCompRoundInfo: totals valid completions, then ranks them.
  async function roundInfoFor(seasonNumber, roundNumber) {
    const season = await models.CompetitiveSeason.findOne({ number: seasonNumber }).lean();
    const completions = await models.CompetitiveGameCompletion.find({
      season: seasonNumber,
      round: roundNumber,
      valid: true,
    }).lean();
    const users = {};
    for (const completion of completions) {
      users[completion.userId] = users[completion.userId] || { points: 0 };
      users[completion.userId].points += completion.points;
    }
    return {
      standings: computeStandings(users, getSeasonRules(season).minimumPointsToPlace),
    };
  }

  const round = () => models.CompetitiveRound.findOne({ season: 1, number: 1 }).lean();
  const hearts = async () => (await models.User.findOne({ id: "alice" }).lean()).goldHearts;
  const season = () => models.CompetitiveSeason.findOne({ number: 1 }).lean();
  const earn = (userId, day, points) =>
    models.CompetitiveGameCompletion.create({
      userId,
      game: new mongoose.Types.ObjectId(),
      season: 1,
      round: 1,
      day,
      points,
    });

  async function runDays(fromDay, toDay) {
    for (let day = fromDay; day <= toDay; day++) {
      await competitive.progressCompetitive(at(day));
    }
  }

  it("gives hearts on all 8 open days, then an extra grace day with no new hearts", async function () {
    await competitive.progressCompetitive(at(0)); // creates the round
    await runDays(1, 8);

    let r = await round();
    r.currentDay.should.equal(8);
    r.remainingOpenDays.should.equal(0);
    should.not.exist(r.openPhaseEndedAt);
    (await hearts()).should.equal(8 * constants.goldHeartsPerCompetitiveDay);

    // A second check later the same day changes nothing
    await competitive.progressCompetitive(at(8, 12 * 60));
    (await hearts()).should.equal(8 * constants.goldHeartsPerCompetitiveDay);

    // Day 9 is the grace day: the open phase ends and no hearts are added
    await competitive.progressCompetitive(at(9));
    r = await round();
    r.currentDay.should.equal(9);
    r.openPhaseEndedAt.should.equal(at(9).getTime());
    r.completed.should.equal(false);
    (await hearts()).should.equal(8 * constants.goldHeartsPerCompetitiveDay);

    // 24 hours later hearts reset and the round closes
    await competitive.progressCompetitive(at(9, 12 * 60));
    (await round()).completed.should.equal(false);
    await competitive.progressCompetitive(at(10, 6));
    r = await round();
    r.completed.should.equal(true);
    (await hearts()).should.equal(0);
  });

  it("lets the finish line day play out, then makes the next day the grace day", async function () {
    await competitive.progressCompetitive(at(0));
    await runDays(1, 3);

    // Alice crosses 1500 in the afternoon of day 3
    await earn("alice", 3, 1500);
    const reached = await competitive.checkFinishLine(await season(), await round(), at(3, 15 * 60).getTime());
    reached.should.equal(true);

    let r = await round();
    r.finishLineReachedAt.should.equal(at(3, 15 * 60).getTime());
    should.not.exist(r.openPhaseEndedAt);

    // The rest of day 3 is unchanged
    await competitive.progressCompetitive(at(3, 20 * 60));
    r = await round();
    r.currentDay.should.equal(3);
    should.not.exist(r.openPhaseEndedAt);

    // Day 4 is the grace day, with no new hearts
    await competitive.progressCompetitive(at(4));
    r = await round();
    r.currentDay.should.equal(4);
    r.openPhaseEndedAt.should.equal(at(4).getTime());
    (await hearts()).should.equal(3 * constants.goldHeartsPerCompetitiveDay);
  });

  it("notices a finish line reached since the last check at the next day boundary", async function () {
    await competitive.progressCompetitive(at(0));
    await runDays(1, 2);
    await earn("bob", 2, 1600);

    await competitive.progressCompetitive(at(3));
    const r = await round();
    r.currentDay.should.equal(3);
    should.exist(r.openPhaseEndedAt);
    (await hearts()).should.equal(2 * constants.goldHeartsPerCompetitiveDay);
  });

  it("uses each season's own finish line", async function () {
    await models.CompetitiveSeason.updateOne({ number: 1 }, { $set: { finishLinePoints: 800 } });
    await competitive.progressCompetitive(at(0));
    await runDays(1, 1);
    await earn("alice", 1, 799);
    (await competitive.checkFinishLine(await season(), await round(), at(1, 60).getTime())).should.equal(false);
    await earn("alice", 1, 1);
    (await competitive.checkFinishLine(await season(), await round(), at(1, 90).getTime())).should.equal(true);
  });

  it("holds 4 review days after the grace day, then gives prestige only to players above the minimum", async function () {
    await competitive.progressCompetitive(at(0));
    await runDays(1, 9);
    await earn("alice", 2, 620);
    await earn("bob", 3, 480);
    await competitive.progressCompetitive(at(10, 6)); // grace ends
    (await round()).completed.should.equal(true);

    for (const day of [10, 11, 12, 13]) {
      await competitive.accountCompetitiveRounds(at(day, 7));
      (await round()).accounted.should.equal(false);
    }
    await competitive.accountCompetitiveRounds(at(13, 23 * 60));
    (await round()).accounted.should.equal(false);

    await competitive.accountCompetitiveRounds(at(14, 7));
    (await round()).accounted.should.equal(true);

    const standings = await models.CompetitiveSeasonStanding.find({ season: 1 }).lean();
    const byUser = Object.fromEntries(standings.map((s) => [s.userId, s]));
    byUser.alice.points.should.equal(competitive.POINTS_TABLE[0]);
    byUser.bob.points.should.equal(0);
    byUser.bob.tiebreakerPoints.should.equal(480);

    // Single-round season: it ends now, and only a player who placed gets a trophy
    (await season()).completed.should.equal(true);
    const trophies = await models.Trophy.find({}).lean();
    trophies.map((t) => [t.ownerId, t.type]).should.deep.equal([["alice", "gold"]]);
  });
});
