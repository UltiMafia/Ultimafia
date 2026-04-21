const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const { getBasicUserInfo } = require("../modules/redis");
const logger = require("../modules/logging")(".");
const errors = require("../lib/errors");
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
      case "role":
        itemModel = models.RoleVote;
        break;
      case "deck":
        itemModel = models.AnonymousDeck;
        break;
      default:
        errors.badRequest(res, "Invalid item type.");
        return;
    }

    let itemQuery;

    if (itemType === "role") {
      // Roles are static (defined in code), so RoleVote rows are created
      // lazily on the first vote. Upsert here so the document always exists
      // before the vote-count update below.
      itemQuery = itemModel
        .findOneAndUpdate(
          { id: itemId },
          { $setOnInsert: { id: itemId } },
          { upsert: true, new: true, projection: "id" }
        );
    } else {
      itemQuery = itemModel.findOne({ id: itemId });
    }

    if (itemType === "strategy") {
      itemQuery = itemQuery.select("deleted");
    } else if (itemType === "setup" || itemType === "deck") {
      itemQuery = itemQuery.select("id");
    } else if (itemType !== "role") {
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
      errors.notFound(res, "Item does not exist.");
      return;
    }

    if (itemType === "strategy" && item.deleted) {
      errors.forbidden(res, "Cannot vote on a deleted strategy.");
      return;
    }

    var requiredRank = 0;

    if (
      itemType !== "strategy" &&
      itemType !== "setup" &&
      itemType !== "role" &&
      itemType !== "deck"
    ) {
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
      errors.badRequest(res, "Bad vote direction.");
      return;
    }

    var vote = await models.ForumVote.findOne({ voter: userId, item: itemId });

    let incVoteCount, incUp, incDown;
    if (itemType === "setup" || itemType === "role") {
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

    const aggregateUpdate = [
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
    ];

    if (!vote) {
      vote = new models.ForumVote({
        voter: userId,
        item: itemId,
        direction: direction,
      });
      await vote.save();

      if (itemType === "setup" || itemType === "role") {
        await itemModel.updateOne({ id: itemId }, aggregateUpdate);
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

      if (itemType === "setup" || itemType === "role") {
        await itemModel.updateOne({ id: itemId }, aggregateUpdate);
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

      if (itemType === "setup" || itemType === "role") {
        await itemModel.updateOne({ id: itemId }, aggregateUpdate);
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
    errors.serverError(res, "Error voting. Please try again.");
  }
});

router.get("/role/:roleId", async function (req, res) {
  try {
    const itemId = String(req.params.roleId);
    const userId = await routeUtils.verifyLoggedIn(req, true);

    const [roleVote, userVote] = await Promise.all([
      models.RoleVote.findOne({ id: itemId }).select("voteCount").lean(),
      userId
        ? models.ForumVote.findOne({ voter: userId, item: itemId })
            .select("direction")
            .lean()
        : null,
    ]);

    res.status(200);
    res.send({
      voteCount: roleVote?.voteCount ?? 0,
      vote: userVote?.direction ?? 0,
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load role vote. Please refresh and try again.");
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
    errors.serverError(res, "Could not load votes. Please refresh and try again.");
  }
});

module.exports = router;
