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

const strategyProjection =
  "id author title content createdAt updatedAt voteCount deleted setupId";

function formatAuthor(authorDoc) {
  if (!authorDoc) return null;
  return {
    id: authorDoc.id,
    name: authorDoc.name,
    avatar: authorDoc.avatar,
    groups: authorDoc.groups,
    vanityUrl: authorDoc.vanityUrl,
    deleted: Boolean(authorDoc.deleted),
  };
}

function buildStrategyResponse(strategy, { vote = 0, userId, hasDeletePerm } = {}) {
  const author = formatAuthor(strategy.author);
  const authorId = author?.id;
  const isAuthor = Boolean(userId && authorId && authorId === userId);
  const canDelete = Boolean(hasDeletePerm || isAuthor);
  const isDeleted = Boolean(strategy.deleted);

  return {
    id: strategy.id,
    setupId: strategy.setupId,
    title: strategy.title,
    content: strategy.content,
    createdAt: strategy.createdAt,
    updatedAt: strategy.updatedAt,
    voteCount: strategy.voteCount || 0,
    vote: vote || 0,
    author,
    deleted: isDeleted,
    canEdit: Boolean(isAuthor && !isDeleted),
    canDelete,
    canRestore: Boolean(isDeleted && canDelete),
  };
}

async function getStrategyWithAuthor(strategyId) {
  if (!strategyId) return null;
  return models.Strategy.findOne({ id: strategyId })
    .select(strategyProjection)
    .populate("author", "id name avatar groups vanityUrl deleted")
    .lean();
}

async function getUserVote(userId, strategyId) {
  if (!userId || !strategyId) return 0;

  const voteDoc = await models.ForumVote.findOne({
    voter: userId,
    item: strategyId,
  })
    .select("direction")
    .lean();

  return voteDoc ? voteDoc.direction : 0;
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

    const canViewDeleted =
      Boolean(userId) &&
      (await routeUtils.verifyPermission(userId, "viewDeleted"));
    const hasDeletePerm =
      Boolean(userId) &&
      (await routeUtils.verifyPermission(userId, "deleteStrategy"));

    const strategyFilter = { setupId };
    if (!canViewDeleted) {
      const authorObjectId = req.session?.user?._id;
      if (authorObjectId) {
        strategyFilter.$or = [
          { deleted: false },
          { deleted: true, author: authorObjectId },
        ];
      } else {
        strategyFilter.deleted = false;
      }
    }

    const strategies = await models.Strategy.find(strategyFilter)
      .select(strategyProjection)
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

    const serialized = strategies.map((strategy) =>
      buildStrategyResponse(strategy, {
        vote: voteMap[strategy.id] || 0,
        userId,
        hasDeletePerm,
      })
    );

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

    const createdStrategy = await getStrategyWithAuthor(strategy.id);
    const hasDeletePerm =
      Boolean(userId) &&
      (await routeUtils.verifyPermission(userId, "deleteStrategy"));

    res.status(201);
    res.send(
      buildStrategyResponse(createdStrategy, {
        vote: 0,
        userId,
        hasDeletePerm,
      })
    );
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

    const updatedStrategy = await getStrategyWithAuthor(strategyId);
    const hasDeletePerm =
      Boolean(userId) &&
      (await routeUtils.verifyPermission(userId, "deleteStrategy"));
    const vote = await getUserVote(userId, strategyId);

    res.send(
      buildStrategyResponse(updatedStrategy, {
        vote,
        userId,
        hasDeletePerm,
      })
    );
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating strategy.");
  }
});

router.post("/:strategyId/delete", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const strategyId = sanitizeString(req.params.strategyId);

    if (!strategyId) {
      res.status(400);
      res.send("Strategy ID is required.");
      return;
    }

    const strategy = await getStrategyWithAuthor(strategyId);

    if (!strategy) {
      res.status(404);
      res.send("Strategy not found.");
      return;
    }

    const authorId = strategy.author ? strategy.author.id : null;
    const hasDeletePerm =
      Boolean(userId) &&
      (await routeUtils.verifyPermission(userId, "deleteStrategy"));
    const isAuthor = Boolean(authorId && authorId === userId);

    if (!isAuthor && !hasDeletePerm) {
      res.status(403);
      res.send("You cannot delete this strategy.");
      return;
    }

    if (!strategy.deleted) {
      await models.Strategy.updateOne(
        { id: strategyId },
        { $set: { deleted: true } }
      ).exec();
      strategy.deleted = true;
    }

    if (hasDeletePerm && !isAuthor) {
      await routeUtils.createModAction(userId, "Delete Strategy", [strategyId]);
    }

    const vote = await getUserVote(userId, strategyId);

    res.send(
      buildStrategyResponse(strategy, {
        vote,
        userId,
        hasDeletePerm,
      })
    );
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting strategy.");
  }
});

router.post("/:strategyId/restore", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const strategyId = sanitizeString(req.params.strategyId);

    if (!strategyId) {
      res.status(400);
      res.send("Strategy ID is required.");
      return;
    }

    const strategy = await getStrategyWithAuthor(strategyId);

    if (!strategy) {
      res.status(404);
      res.send("Strategy not found.");
      return;
    }

    const authorId = strategy.author ? strategy.author.id : null;
    const hasDeletePerm =
      Boolean(userId) &&
      (await routeUtils.verifyPermission(userId, "deleteStrategy"));
    const isAuthor = Boolean(authorId && authorId === userId);

    if (!isAuthor && !hasDeletePerm) {
      res.status(403);
      res.send("You cannot restore this strategy.");
      return;
    }

    if (strategy.deleted) {
      await models.Strategy.updateOne(
        { id: strategyId },
        { $set: { deleted: false } }
      ).exec();
      strategy.deleted = false;
    }

    if (hasDeletePerm && !isAuthor) {
      await routeUtils.createModAction(userId, "Restore Strategy", [strategyId]);
    }

    const vote = await getUserVote(userId, strategyId);

    res.send(
      buildStrategyResponse(strategy, {
        vote,
        userId,
        hasDeletePerm,
      })
    );
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error restoring strategy.");
  }
});

module.exports = router;