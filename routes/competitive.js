const express = require("express");
const router = express.Router();
const shortid = require("shortid");
const Random = require("../lib/Random");
const models = require("../db/models");
const redis = require("../modules/redis");
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;
const routeUtils = require("./utils");
const constants = require("../data/constants");
const logger = require("../modules/logging")("(competitive)");

const iso8601DateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Create a new season
router.post("/create", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "createCompetitiveSeason"))) return;

    const startDate = req.body.startDate;
    const numRounds = Number.parseInt(req.body.numRounds || "12");
    const shuffleSetups = Boolean(req.body.shuffleSetups || false);

    const latestSeason = await models.CompetitiveSeason.findOne({})
      .sort({ number: -1 })
      .lean();

    // Determine new season number
    let seasonNumber = 1;
    if(latestSeason && !latestSeason.completed) {
      res.status(400);
      res.send("A competitive season is already in progress.");
      return;
    }
    else if (latestSeason) {
      seasonNumber = latestSeason.number + 1;
    }
    else {
      // This is the first season
    }

    // Validate inputs before conversion
    if (!startDate || startDate.trim() === "") {
      res.status(400);
      res.send("A start date must be provided.");
      return;
    }
    if (!iso8601DateRegex.test(startDate)) {
      res.status(400);
      res.send("The start date must conform to a YYYY-MM-DD format.");
      return;
    }
    const _startDate = new Date(startDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (_startDate < tomorrow) {
      res.status(400);
      res.send("The start date must be at least one day in the future.");
      return;
    }

    const setups = await models.Setup.find({ competitive: true }).select("_id").lean();
    let setupIds = [];
    for (const setup of setups) {
      setupIds.push(ObjectID(setup._id));
    }

    if (shuffleSetups) {
      Random.randomizeArray(setupIds);
    }

    // Create the season only - in periodic.js progressCompetitive we will manage the rounds
    const season = new models.CompetitiveSeason({
      number: seasonNumber,
      startDate: startDate,
      setups: setupIds,
      numRounds: numRounds,
    });

    await season.save();

    // Create mod action
    routeUtils.createModAction(userId, "Create Season", [
      startDate,
      numRounds,
      shuffleSetups,
    ]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating season.");
  }
});

// Get all seasons
router.get("/seasons", async function (req, res) {
  try {
    const seasons = await models.CompetitiveSeason.find({})
      .select("-_id -__v")
      .populate([
        {
          path: "setups",
        },
        {
          path: "rounds",
        },
      ])
      .sort({ number: -1 })
      .lean();

    res.json(seasons);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error fetching polls.");
  }
});

// Get all standings in a season
router.get("/season/:seasonNumber/standings", async function (req, res) {
  try {
    const seasonNumber = Number.parseInt(req.params.seasonNumber);
    let seasonStandings = await models.CompetitiveSeasonStanding.find({ season: seasonNumber })
      .sort({ points: -1 })
      .limit(10)
      .lean();

    for (const seasonStanding of seasonStandings) {
      seasonStanding.user = await redis.getUserInfo(seasonStanding.userId);
    }

    res.json(seasonStandings);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error fetching polls.");
  }
});

// Get all standings in a round
router.get("/season/:seasonNumber/round/:roundNumber/standings", async function (req, res) {
  try {
    const seasonNumber = Number.parseInt(req.params.seasonNumber);
    const roundNumber = Number.parseInt(req.params.roundNumber);
    let roundStandings = await models.CompetitiveRoundStanding.find({ season: seasonNumber, round: roundNumber })
      .sort({ points: -1 })
      .limit(10)
      .lean();

    for (const roundStanding of roundStandings) {
      roundStanding.user = await redis.getUserInfo(roundStanding.userId);
    }

    res.json(roundStandings);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error fetching polls.");
  }
});

module.exports = router;
