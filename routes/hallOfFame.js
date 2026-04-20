const express = require("express");
const router = express.Router();

const hallOfFame = require("../modules/hallOfFame");
const logger = require("../modules/logging")("(hall-of-fame)");
const routeUtils = require("./utils");

router.get("/", async function (req, res) {
  res.setHeader("Content-Type", "application/json");

  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);
    const response = await hallOfFame.getLeaderboard({
      category: String(req.query.category || "overall").trim(),
      page: req.query.page,
      pageSize: req.query.pageSize,
      minGames: req.query.minGames,
      timeRange: String(req.query.timeRange || "all").trim(),
      sortBy: req.query.sortBy ? String(req.query.sortBy).trim() : null,
      sortDirection: String(req.query.sortDirection || "desc").trim().toLowerCase(),
      userId,
    });

    res.send(response);
  } catch (e) {
    logger.error(e);
    res.status(400);
    res.send(e.message || "Error loading Hall of Fame.");
  }
});

module.exports = router;
