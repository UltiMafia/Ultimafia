const express = require("express");
const logger = require("../modules/logging")(".");
const router = express.Router();
const models = require("../db/models");
const donorData = require("../data/donors");
const { violationDefinitions } = require("../data/violations");

router.get("/contributors", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    // Get all users with any contributor types
    // Check that contributorTypes exists and has at least one element
    // Using $where to check array length, or filter after query
    const allContributorsRaw = await models.User.find({
      contributorTypes: { $exists: true },
      deleted: false,
    }).select(
      "id name avatar vanityUrl contributorTypes contributorBio lastActive -_id"
    );

    // Filter to only include users with non-empty contributorTypes array
    const allContributors = allContributorsRaw
      .filter(
        (user) => user.contributorTypes && user.contributorTypes.length > 0
      )
      .sort((a, b) => {
        const la = a.lastActive != null ? a.lastActive : 0;
        const lb = b.lastActive != null ? b.lastActive : 0;
        return lb - la;
      });

    // Format response with contributor types included
    var result = allContributors.map((user) => {
      const userObj = user.toJSON();
      return {
        id: userObj.id,
        name: userObj.name,
        avatar: userObj.avatar,
        vanityUrl: userObj.vanityUrl,
        types: userObj.contributorTypes || [],
        bio: userObj.contributorBio || "",
      };
    });

    res.send(result);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/contributors/art", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const users = await models.User.find({
      deleted: false,
      "roleIconCredits.0": { $exists: true },
    }).select("id name avatar roleIconCredits -_id");

    const artContributors = users.map((u) => {
      const json = u.toJSON();
      const credits = json.roleIconCredits || [];
      delete json.roleIconCredits;
      return {
        user: json,
        roles: { Mafia: credits },
      };
    });

    res.send(artContributors);
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

router.get("/violations", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(violationDefinitions);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

module.exports = router;
