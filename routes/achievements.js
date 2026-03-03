const express = require("express");
const AchievementData = require("../data/Achievements");
const logger = require("../modules/logging")(".");
const router = express.Router();

router.get("/", async function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(AchievementData);
  } catch (e) {
    logger.error(e);
    res.send({});
  }
});

module.exports = router;
