const express = require("express");
const logger = require("../modules/logging")(".");
const router = express.Router();
const models = require("../db/models");
const contributorData = require("../data/contributors");
const donorData = require("../data/donors");
const competitivePlayersData = require("../data/competitivePlayers");

router.get("/contributors", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var result = {};

    // development
    var developmentContributors = [];
    const devs = contributorData["dev"];
    for (let contributor of devs) {
      let user = await models.User.findOne({ name: contributor }).select(
        "id name avatar -_id"
      );
      if (!user) {
        continue;
      }

      developmentContributors.push(user.toJSON());
    }
    result["dev"] = developmentContributors;

    // art
    var artContributors = [];
    const artists = contributorData["art"];
    for (let contributor in artists) {
      let user = await models.User.findOne({ name: contributor }).select(
        "id name avatar -_id"
      );
      if (!user) {
        continue;
      }

      const roles = artists[contributor];
      artContributors.push({
        user: user.toJSON(),
        roles: roles,
      });
    }
    result["art"] = artContributors;

    res.send(result);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/donors", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var result = [];

    const donors = donorData["donor"];
    for (let donor of donors) {
      let user = await models.User.findOne({ name: donor }).select(
        "id name avatar -_id"
      );
      if (!user) {
        continue;
      }

      result.push(user.toJSON());
    }

    res.send(result);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/leaderboard", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var result = [];

    let competitivePlayers = competitivePlayersData["competitivePlayers"];

    for (let player of competitivePlayers) {
      let user = await models.User.findOne({ name: player }).select(
        "id name avatar -_id"
      );

      if (!user) {
        logger.warn(`User not found: ${player}`);
        continue;
      }

      result.push(user.toJSON());
    }

    res.send(result);
  } catch (e) {
    logger.error("Error in /leaderboard route:", e);
    res.status(500).send({ error: e.message });
  }
});
module.exports = router;