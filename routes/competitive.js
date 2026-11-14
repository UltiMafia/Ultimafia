const express = require("express");
const router = express.Router();
const shortid = require("shortid");
const Random = require("../lib/Random");
const models = require("../db/models");
const redis = require("../modules/redis");
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;
const routeUtils = require("./utils");
const logger = require("../modules/logging")("(competitive)");
const errors = require("../lib/errors");

const competitiveSettings = require("../modules/competitiveSettings");
const withCompetitiveLock = require("../modules/competitiveLock");
const { DAY } = require("../modules/competitiveClock");

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
    errors.serverError(res, "Error creating season. Please try again.");
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

    const response = await withCompetitiveLock(latestSeason.number, async (beginMutation) => {
    const current = await models.CompetitiveSeason.findOne({ number: latestSeason.number, completed: false }).lean();
    if (!current) return { status: 409, body: "Season changed. Refresh before retrying." };
    const newPauseState = !current.paused;
    await beginMutation();

    await models.CompetitiveSeason.updateOne(
      { _id: ObjectID(latestSeason._id) },
      {
        $set: {
          paused: newPauseState,
        },
      }
    );

    // Create mod action
    await routeUtils.createModAction(userId, "Toggle Competitive Season Pause", []);

    await redis.invalidateCompRoundCache(current.number, current.currentRound);
    return { body: newPauseState };
    }, false, "toggle pause");
    return res.status(response.status || 200).send(response.body);
  } catch (e) {
    logger.error(e);
    if (e.status === 409) return res.status(409).send(e.message);
    errors.serverError(res, "Error toggling pause for season. Please try again.");
  }
});

// Explicit controls avoid turning a repeated Play/Pause request into its opposite.
router.post("/controls", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "manageCompetitive"))) return;
    const { seasonNumber, paused, settings } = req.body;
    if (!Number.isSafeInteger(seasonNumber) || seasonNumber < 1 ||
        (paused !== undefined && typeof paused !== "boolean") ||
        (settings !== undefined && (!settings || typeof settings !== "object" || Array.isArray(settings))) ||
        (paused === undefined && settings === undefined)) {
      return res.status(400).send("Invalid competitive controls.");
    }
    const response = await withCompetitiveLock(seasonNumber, async (beginMutation) => {
    const changes = {};
    if (paused !== undefined) changes.paused = paused;
    const minimums = { openDays: 1, reviewDays: 0, dailyHearts: 0, fortuneLimit: 1, graceHours: 0 };
    for (const [name, value] of Object.entries(settings || {})) {
      if (!Object.prototype.hasOwnProperty.call(minimums, name) ||
          !(name === "fortuneLimit" && value === null) &&
          (!Number.isSafeInteger(value) || value < minimums[name]) ||
          (name === "graceHours" && value * 3600000 + Date.now() > 8640000000000000) ||
          (["openDays", "reviewDays"].includes(name) && value * 86400000 + Date.now() > 8640000000000000)) {
        return { status: 400, body: "Invalid competitive setting." };
      }
      changes[name] = value;
    }
    if (!Object.keys(changes).length) return { status: 400, body: "No changes supplied." };
    const durationNames = ["openDays", "reviewDays", "graceHours"];
    const durationSnapshot = {};
    if (durationNames.some((name) => Object.prototype.hasOwnProperty.call(changes, name))) {
      // Individually valid durations can still overflow when used together.
      const currentSeason = await models.CompetitiveSeason.findOne({
        number: seasonNumber, completed: false,
      }).lean();
      if (!currentSeason) return { status: 409, body: "This season is no longer active. Refresh before changing controls." };
      const effective = competitiveSettings({ ...currentSeason, ...changes });
      const totalMillis = (effective.openDays + effective.reviewDays) * 86400000 +
        effective.graceHours * 3600000;
      if (!Number.isSafeInteger(totalMillis) || totalMillis + Date.now() > 8640000000000000) {
        return { status: 400, body: "Combined competitive durations exceed the supported date range." };
      }
      // Compare the durations read above atomically so concurrent requests
      // cannot combine two independently valid changes into an invalid total.
      for (const name of durationNames) {
        durationSnapshot[name] = currentSeason[name] === undefined ?
          { $exists: false } : currentSeason[name];
      }
    }
    await beginMutation();
    // Return the actual previous values from the same atomic update for the audit.
    const season = await models.CompetitiveSeason.findOneAndUpdate(
      { number: seasonNumber, completed: false, ...durationSnapshot }, { $set: changes }, { new: false }
    ).lean();
    if (!season) return { status: 409, body: "Season or settings changed. Refresh before changing controls." };
    // A Redis failure must not prevent recording the already applied change.
    // Also attempt invalidation if audit persistence fails, so stale pause state
    // is not retained simply because the audit store is unavailable.
    try {
      await routeUtils.createModAction(userId, "Update Competitive Controls", [
        season.number,
        JSON.stringify({ before: { paused: season.paused, ...competitiveSettings(season) }, after: changes }),
      ]);
    } finally {
      await redis.invalidateCompRoundCache(season.number, season.currentRound);
    }
    return { body: { paused: changes.paused ?? season.paused, settings: competitiveSettings({ ...season, ...changes }) } };
    }, false, "update controls");
    return res.status(response.status || 200).send(response.body);
  } catch (e) {
    logger.error(e);
    if (e.status === 409) return res.status(409).send(e.message);
    errors.serverError(res, "Error updating competitive controls. Refresh before retrying.");
  }
});

// Restart only the active open countdown. Scores, hearts, historical day IDs,
// historical start date and the configured fortune threshold stay unchanged.
router.post("/restartClock", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "manageCompetitive"))) return;
    const { seasonNumber, roundNumber, requestId } = req.body;
    if (!Number.isSafeInteger(seasonNumber) || seasonNumber < 1 ||
        !Number.isSafeInteger(roundNumber) || roundNumber < 1 ||
        typeof requestId !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) {
      return res.status(400).send("Invalid restart request.");
    }
    const response = await withCompetitiveLock(seasonNumber, async (beginMutation) => {
      const season = await models.CompetitiveSeason.findOne({ number: seasonNumber }).lean();
      const round = await models.CompetitiveRound.findOne({ season: seasonNumber, number: roundNumber }).lean();
      const previousRestart = round?.clockRestarts?.find((entry) => entry.requestId === requestId);
      if (previousRestart) {
        return { body: { restartedAt: previousRestart.at, replay: true } };
      }
      if (!season || season.completed || season.currentRound !== roundNumber ||
          !round || round.completed || round.accounted || round.openPhaseEndedAt || round.currentDay < 1) {
        return { status: 409, body: "Only the current open round's clock can be restarted. Refresh before retrying." };
      }
      const { openDays } = competitiveSettings(season);
      const now = Date.now();
      const clockBaseAt = now + DAY - round.currentDay * DAY;
      if (!Number.isSafeInteger(clockBaseAt) || now + openDays * DAY > 8640000000000000) {
        return { status: 400, body: "Restart duration exceeds the supported date range." };
      }
      const before = { clockBaseAt: round.clockBaseAt, remainingOpenDays: round.remainingOpenDays };
      const after = { clockBaseAt, remainingOpenDays: openDays };
      await beginMutation();
      await models.CompetitiveRound.updateOne({ _id: round._id }, {
        $set: after, $push: { clockRestarts: { requestId, at: now, openDays, clockBaseAt } },
      });
      try {
        await routeUtils.createModAction(userId, "Restart Competitive Clock", [
          seasonNumber, roundNumber, JSON.stringify({ before, after }),
        ]);
      } finally {
        await redis.invalidateCompRoundCache(seasonNumber, roundNumber);
      }
      return { body: { restartedAt: now, replay: false } };
    }, false, "restart clock");
    return res.status(response.status || 200).send(response.body);
  } catch (e) {
    logger.error(e);
    if (e.status === 409) return res.status(409).send(e.message);
    errors.serverError(res, "Could not finish clock restart. Refresh; do not submit a new restart to retry.");
  }
});

// Adjust points for a specific user's competitive game completion
router.post("/adjustPoints", async function (req, res) {
  try {
    const modUserId = await routeUtils.verifyLoggedIn(req);

    if (
      !(await routeUtils.verifyPermission(res, modUserId, "manageCompetitive"))
    )
      return;

    const gameId = String(req.body.gameId || "").trim();
    const targetUserId = String(req.body.userId || "").trim();
    const deltaRaw = req.body.delta;
    const delta = Number(deltaRaw);

    if (!gameId) {
      res.status(400);
      res.send("Game ID is required.");
      return;
    }

    if (!targetUserId) {
      res.status(400);
      res.send("User ID is required.");
      return;
    }

    if (!Number.isFinite(delta) || delta === 0) {
      res.status(400);
      res.send("Delta must be a non-zero number.");
      return;
    }

    const game = await models.Game.findOne({ id: gameId }).select("_id").lean();

    if (!game) {
      res.status(404);
      res.send("Game not found.");
      return;
    }

    const completion = await models.CompetitiveGameCompletion.findOne({
      game: game._id,
      userId: targetUserId,
      valid: true,
    });

    if (!completion) {
      res.status(404);
      res.send(
        "No valid competitive game completion found for that game and user."
      );
      return;
    }

    completion.points = (completion.points || 0) + delta;
    await completion.save();

    await redis.invalidateCompRoundCache(completion.season, completion.round);

    routeUtils.createModAction(modUserId, "Adjust Competitive Points", [
      gameId,
      targetUserId,
      String(delta),
    ]);

    res.json({
      success: true,
      season: completion.season,
      round: completion.round,
      userId: completion.userId,
      gameId,
      updatedPoints: completion.points,
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error adjusting competitive points. Please try again.");
  }
});

// Disqualify a user from a round (set their completions for that round to invalid)
router.post("/disqualify", async function (req, res) {
  try {
    var modUserId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, modUserId, "manageCompetitive")))
      return;

    const season = Number.parseInt(req.body.season, 10);
    const round = Number.parseInt(req.body.round, 10);
    const targetUserId = String(req.body.userId).trim();

    if (isNaN(season) || season < 1) {
      res.status(400);
      res.send("Season must be a positive number.");
      return;
    }
    if (isNaN(round) || round < 1) {
      res.status(400);
      res.send("Round must be a positive number.");
      return;
    }
    if (!targetUserId) {
      res.status(400);
      res.send("User ID is required.");
      return;
    }

    const result = await models.CompetitiveGameCompletion.updateMany(
      { season, round, userId: targetUserId },
      { $set: { valid: false } }
    );

    if (result.matchedCount === 0) {
      res.status(404);
      res.send(
        "No competitive game completions found for that season, round, and user."
      );
      return;
    }

    await redis.invalidateCompRoundCache(season, round);

    routeUtils.createModAction(modUserId, "Disqualify User", [
      season,
      round,
      targetUserId,
    ]);

    res.json({
      message: "User disqualified from round.",
      modifiedCount: result.modifiedCount,
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error disqualifying user. Please try again.");
  }
});

router.post("/endRoundEarly", async function (req, res) {
  try {
    const modUserId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, modUserId, "manageCompetitive")))
      return;

    const season = Number.parseInt(req.body.season, 10);
    const round = Number.parseInt(req.body.round, 10);

    if (isNaN(season) || season < 1) {
      res.status(400);
      res.send("Season must be a positive number.");
      return;
    }

    if (isNaN(round) || round < 1) {
      res.status(400);
      res.send("Round must be a positive number.");
      return;
    }

    const response = await withCompetitiveLock(season, async (beginMutation) => {
    const competitiveRound = await models.CompetitiveRound.findOne({
      season,
      number: round,
    }).lean();

    if (!competitiveRound) {
      return { status: 404, body: "Round not found." };
    }

    // Only allow this while a round is actively in open days.
    if (competitiveRound.currentDay < 1 || competitiveRound.completed) {
      return { status: 400, body: "Round is not live." };
    }

    if (competitiveRound.remainingOpenDays <= 0) {
      return { status: 400, body: "Round can only be ended early during open days, not during review days." };
    }

    if (competitiveRound.remainingReviewDays <= 0) {
      return { status: 400, body: "Round has no review days remaining." };
    }

    const now = new Date();
    await beginMutation();

    await models.CompetitiveRound.updateOne(
      { _id: ObjectID(competitiveRound._id) },
      {
        $set: {
          openPhaseEndedAt: now.getTime(),
          remainingOpenDays: 0,
        },
        $inc: {
          currentDay: 1,
        },
      }
    );

    await redis.invalidateCompRoundCache(season, round);

    await routeUtils.createModAction(modUserId, "End Round Early", [season, round]);

    return { body: {
      message:
        "Round open phase ended; players have 24 hours to finish remaining gold hearts.",
      season,
      round,
    } };
    }, false, "end round early");
    return res.status(response.status || 200).send(response.body);
  } catch (e) {
    logger.error(e);
    if (e.status === 409) return res.status(409).send(e.message);
    errors.serverError(res, "Error ending round early. Please try again.");
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
    errors.serverError(res, "Could not load seasons. Please refresh and try again.");
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
      points: { $gt: 0 },
    })
      .select("-_id userId points tiebreakerPoints")
      .sort({
        points: -1,
        tiebreakerPoints: -1,
       })
      .limit(100)
      .lean();

    seasonInfo.standings = seasonInfo.standings.map((standing, index) => {
      return {
        ...standing,
        ranking: index,
      };
    });

    const usersBulk = await redis.getUserInfoBulk(seasonInfo.standings.map(s => s.userId));
    seasonInfo.users = seasonInfo.standings.reduce((accumulator, seasonStanding, i) => {
      return {
        ...accumulator,
        [seasonStanding.userId]: {
          points: seasonStanding.points,
          tiebreakerPoints: seasonStanding.tiebreakerPoints,
          user: usersBulk[seasonStanding.userId],
        },
      };
    }, {});

    res.json(seasonInfo);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load season. Please refresh and try again.");
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
    errors.serverError(res, "Could not load current round info. Please refresh and try again.");
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
      .select("setups setupOrder number numRounds paused currentRound openDays reviewDays dailyHearts fortuneLimit graceHours operationName operationStartedAt operationPhase")
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
      errors.serverError(res, "Season has invalid setups data.");
      return;
    }

    if (!currentSeason.setupOrder || !Array.isArray(currentSeason.setupOrder)) {
      errors.serverError(res, "Season has invalid setupOrder data.");
      return;
    }

    res.json({
      seasonNumber: currentSeason.number,
      setups: currentSeason.setups,
      setupOrder: currentSeason.setupOrder,
      numRounds: currentSeason.numRounds,
      paused: currentSeason.paused,
      currentRound: currentSeason.currentRound,
      settings: competitiveSettings(currentSeason),
      operation: currentSeason.operationName ? { name: currentSeason.operationName, startedAt: currentSeason.operationStartedAt, phase: currentSeason.operationPhase } : null,
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load current season. Please refresh and try again.");
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
    errors.serverError(res, "Error adding setup to season. Please try again.");
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
    errors.serverError(res, "Error updating setup order. Please try again.");
  }
});

module.exports = router;
