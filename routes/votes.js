const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const { getBasicUserInfo } = require("../modules/redis");
const logger = require("../modules/logging")(".");
const router = express.Router();

router.post("/", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const itemId = String(req.body.item);
    const itemType = String(req.body.itemType);
    const perm = "vote";
    let itemModel;

    switch (itemType) {
      case "thread":
        itemModel = models.ForumThread;
        break;
      case "reply":
        itemModel = models.ForumReply;
        break;
      case "comment":
        itemModel = models.Comment;
        break;
      case "strategy":
        itemModel = models.Strategy;
        break;
      case "setup":
        itemModel = models.Setup;
        break;
      default:
        res.status(500);
        res.send("Invalid item type.");
        return;
    }

    let itemQuery = itemModel.findOne({ id: itemId });

    if (itemType === "strategy") {
      itemQuery = itemQuery.select("deleted");
    } else if (itemType === "setup") {
      itemQuery = itemQuery.select("id");
    } else {
      let populates = [];
      if (itemModel.schema.paths.board) {
        populates.push({
          path: "board",
          select: "rank",
        });
      }

      if (itemModel.schema.paths.thread) {
        populates.push({
          path: "thread",
          select: "board",
          populate: {
            path: "board",
            select: "rank",
          },
        });
      }

      itemQuery = itemQuery.select("board thread rank").populate(populates);
    }

    const item = await itemQuery;

    if (!item) {
      res.status(500);
      res.send("Item does not exist.");
      return;
    }

    if (itemType === "strategy" && item.deleted) {
      res.status(500);
      res.send("Cannot vote on a deleted strategy.");
      return;
    }

    var requiredRank = 0;

    if (itemType !== "strategy" && itemType !== "setup") {
      requiredRank =
        (item.board && item.board.rank) ||
        (item.thread && item.thread.board && item.thread.board.rank) ||
        0;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, requiredRank)))
      return;

    if (!(await routeUtils.rateLimit(userId, "vote", res))) return;

    var direction = Number(req.body.direction);

    if (direction != 1 && direction != -1) {
      res.status(500);
      res.send("Bad vote direction");
      return;
    }

    var vote = await models.ForumVote.findOne({ voter: userId, item: itemId });

    let incVoteCount, incUp, incDown;
    if (itemType === "setup") {
      if (!vote) {
        incVoteCount = direction;
        incUp = direction === 1 ? 1 : 0;
        incDown = direction === -1 ? 1 : 0;
      } else if (vote.direction !== direction) {
        incVoteCount = 2 * direction;
        incUp = direction === 1 ? 1 : -1;
        incDown = direction === -1 ? 1 : -1;
      } else {
        incVoteCount = -direction;
        incUp = direction === 1 ? -1 : 0;
        incDown = direction === -1 ? -1 : 0;
      }
    }

    if (!vote) {
      vote = new models.ForumVote({
        voter: userId,
        item: itemId,
        direction: direction,
      });
      await vote.save();

      if (itemType === "setup") {
        await models.Setup.updateOne(
          { id: itemId },
          [
            {
              $set: {
                voteCount: { $add: ["$voteCount", incVoteCount] },
                upVotes: { $add: ["$upVotes", incUp] },
                downVotes: { $add: ["$downVotes", incDown] },
              },
            },
            {
              $set: {
                controversialScore: { $min: ["$upVotes", "$downVotes"] },
              },
            },
          ]
        );
      } else {
        await itemModel
          .updateOne({ id: itemId }, { $inc: { voteCount: direction } })
          .exec();
      }

      res.send(String(direction));
    } else if (vote.direction != direction) {
      await models.ForumVote.updateOne(
        { voter: userId, item: itemId },
        { $set: { direction: direction } }
      ).exec();

      if (itemType === "setup") {
        await models.Setup.updateOne(
          { id: itemId },
          [
            {
              $set: {
                voteCount: { $add: ["$voteCount", incVoteCount] },
                upVotes: { $add: ["$upVotes", incUp] },
                downVotes: { $add: ["$downVotes", incDown] },
              },
            },
            {
              $set: {
                controversialScore: { $min: ["$upVotes", "$downVotes"] },
              },
            },
          ]
        );
      } else {
        await itemModel
          .updateOne(
            { id: itemId },
            { $inc: { voteCount: 2 * direction } }
          )
          .exec();
      }

      res.send(String(direction));
    } else {
      await models.ForumVote.deleteOne({ voter: userId, item: itemId }).exec();

      if (itemType === "setup") {
        await models.Setup.updateOne(
          { id: itemId },
          [
            {
              $set: {
                voteCount: { $add: ["$voteCount", incVoteCount] },
                upVotes: { $add: ["$upVotes", incUp] },
                downVotes: { $add: ["$downVotes", incDown] },
              },
            },
            {
              $set: {
                controversialScore: { $min: ["$upVotes", "$downVotes"] },
              },
            },
          ]
        );
      } else {
        await itemModel
          .updateOne(
            { id: itemId },
            { $inc: { voteCount: -1 * direction } }
          )
          .exec();
      }

      res.send("0");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error voting.");
  }
});

router.get("/:id/:direction?", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "viewVotes"))) return;

    const search = {
      item: req.params.id,
    };
    if (req.params.direction) {
      search.direction = parseInt(req.params.direction);
    }
    const votes = await models.ForumVote.aggregate([
      { $match: search },
      { $project: { voter: 1, direction: 1 } },
    ]);

    const mappedVotes = await Promise.all(
      votes.map(async (e) => {
        e.voter = await getBasicUserInfo(e.voter, true);
        return e;
      })
    );
    res.status(200);
    res.send(mappedVotes);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting votes.");
  }
});

module.exports = router;
