const express = require("express");
const router = express.Router();
const shortid = require("shortid");
const models = require("../db/models");
const routeUtils = require("./utils");
const logger = require("../modules/logging")("(poll)");

// Create a new poll
router.post("/create", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "createPoll"))) return;

    // Validate inputs before conversion
    if (!req.body.lobby || req.body.lobby.trim() === "") {
      res.status(400);
      res.send("A lobby must be assigned to create a poll.");
      return;
    }

    if (!req.body.question || req.body.question.trim() === "") {
      res.status(400);
      res.send("A question is required to create a poll.");
      return;
    }

    var options = req.body.options || [];

    if (!Array.isArray(options) || options.length < 2) {
      res.status(400);
      res.send("At least 2 response options are required to create a poll.");
      return;
    }

    if (options.length > 10) {
      res.status(400);
      res.send("Polls cannot have more than 10 options.");
      return;
    }

    // Convert to strings after validation
    var lobby = String(req.body.lobby).trim();
    var question = String(req.body.question).trim();

    // Parse expiration time
    var expiresAt = null;
    if (req.body.expiration) {
      var expirationLength = routeUtils.parseTime(String(req.body.expiration));
      if (expirationLength && expirationLength !== Infinity) {
        expiresAt = Date.now() + expirationLength;
      }
    }

    // Create the poll
    var poll = new models.Poll({
      id: shortid.generate(),
      lobby,
      title: question, // Use question as title
      question,
      options,
      creator: userId,
      created: Date.now(),
      expiresAt: expiresAt,
    });

    await poll.save();

    // Create mod action
    routeUtils.createModAction(userId, "Create Poll", [
      lobby,
      question,
      options.join(","),
    ]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating poll.");
  }
});

// Get polls for a lobby
router.get("/list/:lobby", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var lobby = String(req.params.lobby);
    var page = parseInt(req.query.page) || 1;
    var limit = 1;
    var skip = (page - 1) * limit;

    const isAllLobbies = lobby === "All";
    const redis = require("../modules/redis");

    // Helper function to populate poll data
    async function populatePollData(poll) {
      var pollVotes = await models.PollVote.find({ pollId: poll.id }).lean();
      var userVote = pollVotes.find((vote) => vote.userId === userId);

      // Count votes per option
      poll.voteCounts = poll.options.map((_, index) => {
        return pollVotes.filter((vote) => vote.optionIndex === index).length;
      });

      // Get voter info (user IDs and names) for each option
      var voterInfo = {};
      for (let vote of pollVotes) {
        if (!voterInfo[vote.optionIndex]) {
          voterInfo[vote.optionIndex] = [];
        }

        // Get user info from Redis
        var userInfo = await redis.getUserInfo(vote.userId);
        voterInfo[vote.optionIndex].push({
          userId: vote.userId,
          name: userInfo ? userInfo.name : "Unknown User",
        });
      }

      poll.voteCounts = poll.voteCounts;
      poll.userVote = userVote ? userVote.optionIndex : null;
      poll.voterInfo = voterInfo;
    }

    let currentPoll = null;
    let activePolls = [];

    if (isAllLobbies) {
      // For "All" lobby, get all active polls from all lobbies
      activePolls = await models.Poll.find({
        completed: false,
      })
        .sort({ created: -1 })
        .lean();

      // Populate data for each active poll
      for (let poll of activePolls) {
        await populatePollData(poll);
      }
    } else {
      // Get current poll (most recent non-completed)
      currentPoll = await models.Poll.findOne({
        lobby,
        completed: false,
      })
        .sort({ created: -1 })
        .lean();

      // Get vote counts and user votes for current poll
      if (currentPoll) {
        await populatePollData(currentPoll);
      }
    }

    // Get polls for history
    const lobbyQuery = isAllLobbies ? {} : { lobby };
    var polls = await models.Poll.find(lobbyQuery)
      .sort({ created: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Populate vote counts and voter info for all polls in history
    for (let poll of polls) {
      await populatePollData(poll);
    }

    res.json({
      currentPoll,
      activePolls: isAllLobbies ? activePolls : [],
      polls,
      hasMore: polls.length === limit,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error fetching polls.");
  }
});

// Vote on a poll
router.post("/vote", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var pollId = String(req.body.pollId);
    var optionIndex = parseInt(req.body.optionIndex);

    // Validate inputs
    if (!pollId || optionIndex === undefined) {
      res.status(400);
      res.send("Missing pollId or optionIndex.");
      return;
    }

    // Check if poll exists and is not completed
    var poll = await models.Poll.findOne({ id: pollId, completed: false });
    if (!poll) {
      res.status(404);
      res.send("Poll not found or already completed.");
      return;
    }

    // Validate option index
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      res.status(400);
      res.send("Invalid option index.");
      return;
    }

    // Remove any existing vote from this user
    await models.PollVote.deleteOne({ pollId, userId });

    // Create new vote
    var vote = new models.PollVote({
      pollId,
      userId,
      optionIndex,
      votedAt: Date.now(),
    });

    await vote.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error voting on poll.");
  }
});

// Complete a poll (admin/dev only)
router.post("/complete", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var pollId = String(req.body.pollId);

    if (!(await routeUtils.verifyPermission(res, userId, "createPoll"))) return;

    var poll = await models.Poll.findOne({ id: pollId, completed: false });
    if (!poll) {
      res.status(404);
      res.send("Poll not found or already completed.");
      return;
    }

    await models.Poll.updateOne(
      { id: pollId },
      { completed: true, completedAt: Date.now() }
    );

    // Create mod action
    routeUtils.createModAction(userId, "Complete Poll", [pollId, poll.title]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error completing poll.");
  }
});

module.exports = router;
