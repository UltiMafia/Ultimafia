const express = require("express");
const shortid = require("shortid");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const constants = require("../data/constants");
const models = require("../db/models");
const logger = require("../modules/logging")(".");

const router = express.Router();

router.get("/connect", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);

    if (!userId) {
      res.send("");
      return;
    }

    const token = await redis.createAuthToken(userId);
    res.send(token);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading chat.");
  }
});

router.post("/room", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const perm = "createRoom";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const name = routeUtils
      .strParseAlphaNum(req.body.name)
      .slice(0, constants.maxChannelNameLength);
    const position = Number(req.body.position) || 0;
    const rank = Number(req.body.rank) || 0;

    const existingChannel = await models.ChatChannel.findOne({
      name: new RegExp(`^${name}$`, "i"),
      public: true,
    }).select("_id");

    if (existingChannel) {
      res.status(500);
      res.send("A room with this name already exists.");
      return;
    }

    const room = new models.ChatChannel({
      id: shortid.generate(),
      name,
      position,
      rank,
      public: true,
      lastMessageDate: Date.now(),
    });
    room.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating room.");
  }
});

router.post("/room/delete", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const name = routeUtils.strParseAlphaNum(req.body.name);
    const perm = "deleteRoom";

    const channel = await models.ChatChannel.findOne({
      name: new RegExp(`^${name}$`, "i"),
      public: true,
    }).select("id rank");

    if (!channel) {
      res.status(500);
      res.send("Room not found.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, channel.rank)))
      return;

    await models.ChatChannel.deleteOne({ id: channel.id }).exec();
    await models.ChatMessage.deleteMany({ channel: channel.id }).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating room.");
  }
});

module.exports = router;
