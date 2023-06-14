const express = require("express");
const constants = require("../data/constants");
const logger = require("../modules/logging")(".");

const router = express.Router();

router.get("/nextRestart", (req, res) => {
  try {
    if (constants.restart != null) res.send(String(constants.restart));
    else res.send("-1");
  } catch (e) {
    logger.error(e);
    res.send("-1");
  }
});

module.exports = router;
