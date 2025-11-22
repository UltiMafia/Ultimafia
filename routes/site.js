const express = require("express");
const logger = require("../modules/logging")(".");
const router = express.Router();
const models = require("../db/models");
const contributorData = require("../data/contributors");
const donorData = require("../data/donors");

router.get("/contributors", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    // Get all users with any contributor types
    // Check that contributorTypes exists and has at least one element
    // Using $where to check array length, or filter after query
    const allContributorsRaw = await models.User.find({
      contributorTypes: { $exists: true },
      deleted: false,
    }).select("id name avatar vanityUrl contributorTypes contributorBio -_id");
    
    // Filter to only include users with non-empty contributorTypes array
    const allContributors = allContributorsRaw.filter(
      (user) => user.contributorTypes && user.contributorTypes.length > 0
    );

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
    // Return art contributors with their roles from the data file
    // This is used by RolePage to show which artists made which role icons
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

module.exports = router;
