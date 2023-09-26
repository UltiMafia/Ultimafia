const express = require("express");
const shortid = require("shortid");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const logger = require("../modules/logging")(".");
const router = express.Router();

router.get("/", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var location = String(req.query.location);
    var last = Number(req.query.last);
    var first = Number(req.query.first);
    var commentFilter = { location };

    if (!(await routeUtils.verifyPermission(userId, "viewDeleted")))
      commentFilter.deleted = false;

    var comments = await routeUtils.modelPageQuery(
      models.Comment,
      commentFilter,
      "date",
      last,
      first,
      "id author content date voteCount deleted -_id",
      constants.commentsPerPage,
      ["author", "id -_id"]
    );

    for (let i in comments) {
      let comment = comments[i].toJSON();
      comment.author = await redis.getBasicUserInfo(comment.author.id, true);
      comments[i] = comment;
    }

    var votes = {};
    var commentIds = comments.map((comment) => comment.id);

    if (userId) {
      var voteList = await models.ForumVote.find({
        voter: userId,
        item: { $in: commentIds },
      }).select("item direction");

      for (let vote of voteList) votes[vote.item] = vote.direction;

      comments = comments.map((comment) => {
        comment.vote = votes[comment.id] || 0;
        return comment;
      });
    }

    res.send(comments);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading comments.");
  }
});

router.post("/", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "postReply"))) return;

    if (!(await routeUtils.rateLimit(userId, "postComment", res))) return;

    var content = String(req.body.content);
    var location = String(req.body.location).slice(
      0,
      constants.maxCommentLocationLength
    );

    let useLargeCommentLength = location.startsWith("setup");
    let maxLength = useLargeCommentLength
      ? constants.maxLargeCommentLength
      : constants.maxCommentLength;
    if (content.length == 0 || content.length > maxLength) {
      res.status(500);
      res.send(`Content must be between 1 and ${maxLength} characters.`);
      return;
    }

    var comment = new models.Comment({
      id: shortid.generate(),
      author: req.session.user._id,
      date: Date.now(),
      location,
      content,
    });
    await comment.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error posting comment.");
  }
});

router.post("/delete", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var commentId = String(req.body.comment);
    var perm1 = "deleteOwnPost";
    var perm2 = "deleteAnyPost";

    var comment = await models.Comment.findOne({
      id: commentId,
      deleted: false,
    })
      .select("author location")
      .populate("author", "id");

    if (!comment) {
      res.status(500);
      res.send("Comment not found.");
      return;
    }

    let isNotOwnPost =
      comment.author.id != userId && comment.location != userId;
    if (isNotOwnPost || !(await routeUtils.verifyPermission(userId, perm1)))
      if (!(await routeUtils.verifyPermission(res, userId, perm2))) return;

    await models.Comment.updateOne(
      { id: commentId },
      { $set: { deleted: true } }
    ).exec();

    if (isNotOwnPost)
      routeUtils.createModAction(userId, "Delete Comment", [commentId]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting comment.");
  }
});

router.post("/restore", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var commentId = String(req.body.comment);
    var perm = "restoreDeleted";

    var comment = await models.Comment.findOne({ id: commentId }).select("_id");

    if (!comment) {
      res.status(500);
      res.send("Comment not found.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.Comment.updateOne(
      { id: commentId },
      { $set: { deleted: false } }
    ).exec();

    routeUtils.createModAction(userId, "Restore Comment", [commentId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error restoring comment.");
  }
});

module.exports = router;
