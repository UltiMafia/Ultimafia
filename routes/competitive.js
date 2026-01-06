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

    if (!(await routeUtils.verifyPermission(res, userId, "manageCompetitive")))
      return;

    const startDate = req.body.startDate;
    const numRounds = Number.parseInt(req.body.numRounds || "12");
    const setupsPerRound = Number.parseInt(req.body.setupsPerRound || "2");

    const latestSeason = await models.CompetitiveSeason.findOne({})
      .sort({ number: -1 })
      .lean();

    // Determine new season number
    let seasonNumber = 1;
    if (latestSeason && !latestSeason.completed) {
      res.status(400);
      res.send("A competitive season is already in progress.");
      return;
    } else if (latestSeason) {
      seasonNumber = latestSeason.number + 1;
    } else {
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

    const setups = await models.Setup.find({ competitive: true })
      .select("_id factionRatings")
      .lean();

    if (setups.length === 0) {
      res.status(400);
      res.send(
        "There are no competitive setups. Use Competitive Approve mod command to select setups for the season. "
      );
      return;
    }

    let setupIds = setups.map((setup) => ObjectID(setup._id));

    // Repeat setups as many times as necessary to meet the numRounds*setupsPerRound count
    // Then slice them up into chunks of setupsPerRound
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
    routeUtils.createModAction(userId, "Create Competitive Season", [
      startDate,
      numRounds,
      setupsPerRound,
    ]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating season.");
  }
});

router.post("/pause", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "manageCompetitive")))
      return;

    const latestSeason = await models.CompetitiveSeason.findOne({})
      .sort({ number: -1 })
      .lean();

    if (!latestSeason || latestSeason.completed) {
      res.status(400);
      res.send("There is no season in progress.");
      return;
    }

    const newPauseState = !latestSeason.paused;

    await models.CompetitiveSeason.updateOne(
      { _id: ObjectID(latestSeason._id) },
      {
        $set: {
          paused: newPauseState,
        },
      }
    );

    // Create mod action
    routeUtils.createModAction(userId, "Toggle Competitive Season Pause", []);

    res.send(newPauseState);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error toggling pause for season.");
  }
});

// Get all seasons
router.get("/seasons", async function (req, res) {
  try {
    const seasons = await models.CompetitiveSeason.find({})
      .select("-_id -__v -setups")
      .populate([
        {
          path: "rounds",
          select: "-_id -__v",
        },
      ])
      .sort({ number: 1 })
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

    const seasons = await models.CompetitiveSeason.find({
      number: seasonNumber,
    })
      .select("setups setupOrder")
      .populate([
        {
          path: "setups",
        },
      ])
      .lean();

    if (seasons.length === 0) {
      res.status(404);
      res.send("Could not find season.");
      return;
    }

    seasonInfo.setups = seasons[0].setups;
    seasonInfo.setupOrder = seasons[0].setupOrder;

    seasonInfo.standings = await models.CompetitiveSeasonStanding.find({
      season: seasonNumber,
    })
      .select("userId points tiebreakerPoints")
      .sort({ points: -1 })
      .limit(10)
      .lean();

    for (const seasonStanding of seasonInfo.standings) {
      seasonInfo.users[seasonStanding.userId] = {
        points: seasonStanding.points,
        user: await redis.getUserInfo(seasonStanding.userId),
      }
    }

    res.json(seasonInfo);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error fetching season.");
  }
});

router.get("/roundInfo", async function (req, res) {
  try {
    const seasonNumber = req.query.seasonNumber
      ? Number.parseInt(req.query.seasonNumber)
      : null;
    const roundNumber = req.query.roundNumber
      ? Number.parseInt(req.query.roundNumber)
      : null;
    res.json(await redis.getCompRoundInfo(seasonNumber, roundNumber));
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting current round info.");
  }
});

// Get current season data for management
router.get("/current", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "manageCompetitive")))
      return;

    const currentSeason = await models.CompetitiveSeason.findOne({
      completed: false,
    })
      .sort({ number: -1 })
      .select("setups setupOrder number")
      .populate([
        {
          path: "setups",
        },
      ])
      .lean();

    if (!currentSeason) {
      res.status(404);
      res.send("No season in progress.");
      return;
    }

    // Ensure setups and setupOrder exist
    if (!currentSeason.setups || !Array.isArray(currentSeason.setups)) {
      res.status(500);
      res.send("Season has invalid setups data.");
      return;
    }

    if (!currentSeason.setupOrder || !Array.isArray(currentSeason.setupOrder)) {
      res.status(500);
      res.send("Season has invalid setupOrder data.");
      return;
    }

    res.json({
      seasonNumber: currentSeason.number,
      setups: currentSeason.setups,
      setupOrder: currentSeason.setupOrder,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error fetching current season.");
  }
});

// Add a setup to a round in the current season
router.post("/addSetup", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "manageCompetitive")))
      return;

    const setupId = req.body.setupId;
    const roundIndex = Number.parseInt(req.body.roundIndex);

    if (!setupId || typeof setupId !== "string") {
      res.status(400);
      res.send("Setup ID is required.");
      return;
    }

    if (
      roundIndex === undefined ||
      roundIndex === null ||
      isNaN(roundIndex) ||
      roundIndex < 0
    ) {
      res.status(400);
      res.send("Valid round index is required.");
      return;
    }

    // Get the setup and verify it's competitive-approved
    const setup = await models.Setup.findOne({ id: setupId })
      .select("_id competitive")
      .lean();

    if (!setup) {
      res.status(404);
      res.send("Setup not found.");
      return;
    }

    if (!setup.competitive) {
      res.status(400);
      res.send(
        "Setup is not competitive-approved. Use 'Toggle Competitive Setup' command to approve it first."
      );
      return;
    }

    const currentSeason = await models.CompetitiveSeason.findOne({
      completed: false,
    })
      .sort({ number: -1 })
      .lean();

    if (!currentSeason) {
      res.status(404);
      res.send("No season in progress.");
      return;
    }

    // Check if round index is valid
    if (roundIndex >= currentSeason.setupOrder.length) {
      res.status(400);
      res.send(
        `Round index ${roundIndex} is out of bounds. Season has ${currentSeason.setupOrder.length} rounds.`
      );
      return;
    }

    // Check if setup is already in the season's setups array
    const setupObjectId = ObjectID(setup._id);
    let existingIndex = -1;

    // Convert setups array to strings for comparison
    for (let i = 0; i < currentSeason.setups.length; i++) {
      if (String(currentSeason.setups[i]) === String(setupObjectId)) {
        existingIndex = i;
        break;
      }
    }

    let setupNumber;
    if (existingIndex >= 0) {
      // Setup already exists in the season, use its existing index
      setupNumber = existingIndex;
    } else {
      // Append the setup to the setups array
      await models.CompetitiveSeason.updateOne(
        { _id: ObjectID(currentSeason._id) },
        {
          $push: {
            setups: setupObjectId,
          },
        }
      );
      // The new index will be the current length
      setupNumber = currentSeason.setups.length;
    }

    // Add the setup number to the specified round
    const newSetupOrder = currentSeason.setupOrder.map((round) => [...round]);
    newSetupOrder[roundIndex].push(setupNumber);

    await models.CompetitiveSeason.updateOne(
      { _id: ObjectID(currentSeason._id) },
      {
        $set: {
          setupOrder: newSetupOrder,
        },
      }
    );

    // Create mod action
    routeUtils.createModAction(userId, "Add Setup to Season", [
      setupId,
      roundIndex + 1,
    ]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error adding setup to season.");
  }
});

// Update setup order for current season
router.post("/updateSetupOrder", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "manageCompetitive")))
      return;

    const setupOrder = req.body.setupOrder;

    if (!Array.isArray(setupOrder)) {
      res.status(400);
      res.send("setupOrder must be an array.");
      return;
    }

    // Validate that each element is an array of numbers
    for (let i = 0; i < setupOrder.length; i++) {
      if (!Array.isArray(setupOrder[i])) {
        res.status(400);
        res.send(`Round ${i + 1} must be an array.`);
        return;
      }
      for (let j = 0; j < setupOrder[i].length; j++) {
        if (typeof setupOrder[i][j] !== "number") {
          res.status(400);
          res.send(
            `Setup number at round ${i + 1}, position ${
              j + 1
            } must be a number.`
          );
          return;
        }
      }
    }

    const currentSeason = await models.CompetitiveSeason.findOne({
      completed: false,
    })
      .sort({ number: -1 })
      .lean();

    if (!currentSeason) {
      res.status(404);
      res.send("No season in progress.");
      return;
    }

    // Validate that all setup numbers reference valid indices in the setups array
    const maxSetupIndex = currentSeason.setups.length - 1;
    for (let i = 0; i < setupOrder.length; i++) {
      for (let j = 0; j < setupOrder[i].length; j++) {
        const setupNumber = setupOrder[i][j];
        if (setupNumber < 0 || setupNumber > maxSetupIndex) {
          res.status(400);
          res.send(
            `Invalid setup number ${setupNumber} at round ${i + 1}, position ${
              j + 1
            }. Must be between 0 and ${maxSetupIndex}.`
          );
          return;
        }
      }
    }

    await models.CompetitiveSeason.updateOne(
      { _id: ObjectID(currentSeason._id) },
      {
        $set: {
          setupOrder: setupOrder,
        },
      }
    );

    // Create mod action
    routeUtils.createModAction(userId, "Manage Competitive Season Setups", []);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating setup order.");
  }
});

module.exports = router;
