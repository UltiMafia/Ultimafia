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
    const setupsPerRound = Number.parseInt(req.body.setupsPerRound || "2");
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

    if (setups.length === 0) {
      res.status(400);
      res.send("There are no competitive setups. Use Competitive Approve mod command to select setups for the season. ");
      return;
    }

    let setupIds = setups.map((setup) => ObjectID(setup._id));

    if (shuffleSetups) {
      Random.randomizeArray(setupIds);
    }

    let setupOrder = [];
    for (let roundNumber = 0; roundNumber < numRounds; roundNumber++) {
      let roundSetups = [];
      for (let i = 0; i < setupsPerRound; i++) {
        const setupNumber = roundNumber * setupsPerRound + i;
        roundSetups.push(setupNumber % setupIds.length);
      }
      setupOrder.push(roundSetups);
    }

    // Create the season only - in periodic.js progressCompetitive we will manage the rounds
    const season = new models.CompetitiveSeason({
      number: seasonNumber,
      startDate: startDate,
      setups: setupIds,
      setupOrder: setupOrder,
      numRounds: numRounds,
    });

    await season.save();

    // Create mod action
    routeUtils.createModAction(userId, "Create Season", [
      startDate,
      numRounds,
      setupsPerRound,
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
    res.send("Error fetching seasons.");
  }
});

router.get("/season/:seasonNumber", async function (req, res) {
  try {
    const seasonNumber = Number.parseInt(req.params.seasonNumber);

    let seasonInfo = {
      setups: [],
      standings: {},
      users: {},
    };

    const seasons = await models.CompetitiveSeason.find({ number: seasonNumber })
      .select("setups setupOrder")
      .populate([
        {
          path: "setups",
        },
      ])
      .lean();

    if (seasons.length === 0) {
      logger.error(e);
      res.status(404);
      res.send("Could not find season.");
      return;
    }

    seasonInfo.setups = seasons[0].setups;
    seasonInfo.setupOrder = seasons[0].setupOrder;

    seasonInfo.standings = await models.CompetitiveSeasonStanding.find({ season: seasonNumber })
      .sort({ points: -1 })
      .limit(10)
      .lean();

    for (const seasonStanding of seasonInfo.standings) {
      seasonInfo.users[seasonStanding.userId] = await redis.getUserInfo(seasonStanding.userId);
    }

    res.json(seasonInfo);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error fetching season.");
  }
});

// Get the current round info
router.get("/currentRound", async function (req, res) {
  try {
    res.json(await redis.getCurrentCompRoundInfo());
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting current round info.");
  }
});

module.exports = router;
