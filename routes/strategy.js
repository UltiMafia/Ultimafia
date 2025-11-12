const express = require("express");
const shortid = require("shortid");

const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const logger = require("../modules/logging")(".");

const router = express.Router();

function sanitizeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function stringify(value) {
  if (value == null) return "";
  return String(value);
}

router.get("/", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);
    const setupId = sanitizeString(req.query.setupId);

    if (!setupId) {
      res.status(400);
      res.send("Missing setupId.");
      return;
    }

    const canViewDeleted = await routeUtils.verifyPermission(
      userId,
      "viewDeleted"
    );

    const strategyFilter = { setupId };
    if (!canViewDeleted) strategyFilter.deleted = false;

    const strategies = await models.Strategy.find(strategyFilter)
      .select(
        "id author title content createdAt updatedAt voteCount deleted setupId"
      )
      .populate("author", "id name avatar groups vanityUrl deleted")
      .sort({ voteCount: -1, updatedAt: -1, createdAt: -1 })
      .lean();

    const strategyIds = strategies.map((strategy) => strategy.id);
    const voteMap = {};

    if (userId && strategyIds.length > 0) {
      const voteList = await models.ForumVote.find({
        voter: userId,
        item: { $in: strategyIds },
      }).select("item direction");

      for (const vote of voteList) {
        voteMap[vote.item] = vote.direction;
      }
    }

    const serialized = strategies.map((strategy) => {
      const authorDoc = strategy.author;
      const author = authorDoc
        ? {
            id: authorDoc.id,
            name: authorDoc.name,
            avatar: authorDoc.avatar,
            groups: authorDoc.groups,
            vanityUrl: authorDoc.vanityUrl,
            deleted: authorDoc.deleted || false,
          }
        : null;

      const vote = voteMap[strategy.id] || 0;

      return {
        id: strategy.id,
        setupId: strategy.setupId,
        title: strategy.title,
        content: strategy.content,
        createdAt: strategy.createdAt,
        updatedAt: strategy.updatedAt,
        voteCount: strategy.voteCount || 0,
        vote,
        author,
        deleted: Boolean(strategy.deleted),
        canEdit: Boolean(
          author && userId && author.id === userId && !strategy.deleted
        ),
      };
    });

    res.send(serialized);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading strategies.");
  }
});

router.post("/", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "postReply"))) return;

    if (!(await routeUtils.rateLimit(userId, "postStrategy", res))) return;

    const setupId = sanitizeString(req.body.setupId).slice(
      0,
      constants.maxCommentLocationLength
    );
    const title = sanitizeString(req.body.title);
    const content = stringify(req.body.content);
    const trimmedContentLength = content.trim().length;

    if (!setupId) {
      res.status(400);
      res.send("Missing setupId.");
      return;
    }

    if (title.length === 0 || title.length > constants.maxStrategyTitleLength) {
      res.status(400);
      res.send(
        `Title must be between 1 and ${constants.maxStrategyTitleLength} characters.`
      );
      return;
    }

    if (
      trimmedContentLength === 0 ||
      content.length > constants.maxStrategyContentLength
    ) {
      res.status(400);
      res.send(
        `Content must be between 1 and ${constants.maxStrategyContentLength} characters.`
      );
      return;
    }

    const setup = await models.Setup.findOne({ id: setupId })
      .select("_id id gameType")
      .lean();

    if (!setup) {
      res.status(404);
      res.send("Setup not found.");
      return;
    }

    if (setup.gameType !== "Mafia") {
      res.status(400);
      res.send("Strategies are only available for Mafia setups.");
      return;
    }

    const now = Date.now();

    const strategy = new models.Strategy({
      id: shortid.generate(),
      setup: setup._id,
      setupId,
      author: req.session.user._id,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    });

    await strategy.save();

    const authorDoc = await models.User.findById(req.session.user._id)
      .select("id name avatar groups vanityUrl deleted")
      .lean();
    const author = authorDoc
      ? {
          id: authorDoc.id,
          name: authorDoc.name,
          avatar: authorDoc.avatar,
          groups: authorDoc.groups,
          vanityUrl: authorDoc.vanityUrl,
          deleted: authorDoc.deleted || false,
        }
      : null;

    res.status(201);
    res.send({
      id: strategy.id,
      setupId,
      title,
      content,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
      voteCount: 0,
      vote: 0,
      author,
      deleted: false,
      canEdit: true,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating strategy.");
  }
});

router.put("/:strategyId", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const strategyId = sanitizeString(req.params.strategyId);

    const title = sanitizeString(req.body.title);
    const content = stringify(req.body.content);
    const trimmedContentLength = content.trim().length;

    if (title.length === 0 || title.length > constants.maxStrategyTitleLength) {
      res.status(400);
      res.send(
        `Title must be between 1 and ${constants.maxStrategyTitleLength} characters.`
      );
      return;
    }

    if (
      trimmedContentLength === 0 ||
      content.length > constants.maxStrategyContentLength
    ) {
      res.status(400);
      res.send(
        `Content must be between 1 and ${constants.maxStrategyContentLength} characters.`
      );
      return;
    }

    const strategy = await models.Strategy.findOne({ id: strategyId })
      .select("author deleted setupId title content voteCount updatedAt createdAt")
      .populate("author", "id");

    if (!strategy) {
      res.status(404);
      res.send("Strategy not found.");
      return;
    }

    if (strategy.deleted) {
      res.status(400);
      res.send("Cannot edit a deleted strategy.");
      return;
    }

    const authorId = strategy.author ? strategy.author.id : null;

    if (!authorId || authorId !== userId) {
      res.status(403);
      res.send("You cannot edit this strategy.");
      return;
    }

    strategy.title = title;
    strategy.content = content;
    strategy.updatedAt = Date.now();

    await strategy.save();

    const authorDoc = await models.User.findOne({ id: userId })
      .select("id name avatar groups vanityUrl deleted")
      .lean();
    const author = authorDoc
      ? {
          id: authorDoc.id,
          name: authorDoc.name,
          avatar: authorDoc.avatar,
          groups: authorDoc.groups,
          vanityUrl: authorDoc.vanityUrl,
          deleted: authorDoc.deleted || false,
        }
      : null;
    const voteDoc = await models.ForumVote.findOne({
      voter: userId,
      item: strategyId,
    }).select("direction");

    res.send({
      id: strategy.id,
      setupId: strategy.setupId,
      title: strategy.title,
      content: strategy.content,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
      voteCount: strategy.voteCount || 0,
      vote: voteDoc ? voteDoc.direction : 0,
      author,
      deleted: false,
      canEdit: true,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating strategy.");
  }
});

module.exports = router;

