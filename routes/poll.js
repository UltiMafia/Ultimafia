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
    var lobby = String(req.body.lobby);
    var title = String(req.body.title);
    var question = String(req.body.question);
    var options = req.body.options || [];

    if (!(await routeUtils.verifyPermission(res, userId, "createPoll"))) return;

    // Validate inputs
    if (!lobby || !title || !question || !options.length) {
      res.status(400);
      res.send("Missing required fields: lobby, title, question, and options.");
      return;
    }

    if (options.length < 2 || options.length > 10) {
      res.status(400);
      res.send("Polls must have between 2 and 10 options.");
      return;
    }

    // Create the poll
    var poll = new models.Poll({
      id: shortid.generate(),
      lobby,
      title,
      question,
      options,
      creator: userId,
      created: Date.now(),
    });

    await poll.save();

    // Create mod action
    routeUtils.createModAction(userId, "Create Poll", [
      lobby,
      title,
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
    var limit = 10;
    var skip = (page - 1) * limit;

    var polls = await models.Poll.find({ lobby })
      .sort({ created: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get current poll (most recent non-completed)
    var currentPoll = await models.Poll.findOne({
      lobby,
      completed: false,
    })
      .sort({ created: -1 })
      .lean();

    // Get vote counts and user votes for current poll
    if (currentPoll) {
      var votes = await models.PollVote.find({ pollId: currentPoll.id }).lean();
      var userVote = votes.find((vote) => vote.userId === userId);

      // Count votes per option
      var voteCounts = currentPoll.options.map((_, index) => {
        return votes.filter((vote) => vote.optionIndex === index).length;
      });

      // Get voter avatars (without names for privacy)
      var voterAvatars = {};
      for (let vote of votes) {
        if (!voterAvatars[vote.optionIndex]) {
          voterAvatars[vote.optionIndex] = [];
        }
        voterAvatars[vote.optionIndex].push(vote.userId);
      }

      currentPoll.voteCounts = voteCounts;
      currentPoll.userVote = userVote ? userVote.optionIndex : null;
      currentPoll.voterAvatars = voterAvatars;
    }

    res.json({
      currentPoll,
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
