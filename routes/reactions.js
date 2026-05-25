const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const logger = require("../modules/logging")(".");
const errors = require("../lib/errors");
const {
  getReactionSummaries,
  getItemReactionContext,
  getReactionDetails,
} = require("../modules/reactions");

const router = express.Router();

router.post("/", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const itemId = String(req.body.item);
    const itemType = String(req.body.itemType);
    const emote = String(req.body.emote).slice(0, 64);
    const emoteKind = String(req.body.emoteKind || "unicode").slice(0, 16);
    const emotePath = String(req.body.emotePath || "").slice(0, 256);

    if (!emote) {
      errors.badRequest(res, "Emote is required.");
      return;
    }

    if (!["unicode", "site", "custom"].includes(emoteKind)) {
      errors.badRequest(res, "Invalid emote type.");
      return;
    }

    const context = await getItemReactionContext(itemId, itemType);

    if (context.error) {
      errors.badRequest(res, context.error);
      return;
    }

    if (
      !(await routeUtils.verifyPermission(
        res,
        userId,
        "vote",
        context.requiredRank
      ))
    ) {
      return;
    }

    if (!(await routeUtils.rateLimit(userId, "vote", res))) return;

    const existing = await models.ItemReaction.findOne({
      reactor: userId,
      item: itemId,
      emote,
    });

    if (existing) {
      await models.ItemReaction.deleteOne({ _id: existing._id });
    } else {
      await models.ItemReaction.create({
        reactor: userId,
        item: itemId,
        itemType,
        emote,
        emoteKind,
        emotePath: emoteKind === "custom" ? emotePath : "",
      });
    }

    const summaries = await getReactionSummaries([itemId], userId);
    res.send({ reactions: summaries[itemId] || [] });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error reacting. Please try again.");
  }
});

router.get("/:itemId", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "viewVotes"))) return;

    const itemId = String(req.params.itemId);
    const details = await getReactionDetails(itemId);
    res.send(details);
  } catch (e) {
    logger.error(e);
    errors.serverError(
      res,
      "Could not load reactions. Please refresh and try again."
    );
  }
});

module.exports = router;
