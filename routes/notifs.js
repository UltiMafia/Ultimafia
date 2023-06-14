const express = require("express");
const constants = require("../data/constants");
const logger = require("../modules/logging")(".");
const routeUtils = require("./utils");
const { models } = require("mongoose");

const router = express.Router();

router.get("/", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);

    if (!userId) {
      res.send([]);
      return;
    }

    let globalNotifs = await models.User.findOne({ id: userId })
      .select("globalNotifs")
      .populate("globalNotifs", "-_id -_v");
    globalNotifs = globalNotifs.globalNotifs;

    const userNotifs = await models.Notification.find({
      user: userId,
      isChat: false,
    }).select("-_id -_v");

    const notifs = globalNotifs
      .concat(userNotifs)
      .sort((a, b) => b.date - a.date);
    notifs.unshift(constants.restart);
    res.send(notifs);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.post("/viewed", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);

    if (!userId) {
      res.sendStatus(200);
      return;
    }

    await models.User.updateOne(
      { id: userId },
      { $set: { globalNotifs: [] } }
    ).exec();

    await models.Notification.deleteMany({
      user: userId,
      isChat: false,
    }).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

module.exports = router;
