const express = require("express");
const bluebird = require("bluebird");
const fs = require("fs");
const fbAdmin = require("firebase-admin");
const formidable = bluebird.promisifyAll(require("formidable"), {
  multiArgs: true,
});
const sharp = require("sharp");
const shortid = require("shortid");
const color = require("color");
const models = require("../db/models");
const routeUtils = require("./utils");
const utils = require("../lib/Utils");
const redis = require("../modules/redis");
const constants = require("../data/constants");
const dbStats = require("../db/stats");
const { colorHasGoodBackgroundContrast } = require("../shared/colors");
const logger = require("../modules/logging")(".");
const router = express.Router();
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;

router.get("/leaderboard", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let users = await models.User.find({ deleted: false })
      .select("id name avatar kudos karma achievements -_id")
      .sort({ kudos: -1, karma: -1, achievements: -1 })
      .limit(20);

    // Add vanity URLs
    users = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        const vanityUrl = await models.VanityUrl.findOne({
          userId: userObj.id,
        }).select("url -_id");
        
        return {
          ...userObj,
          vanityUrl: vanityUrl?.url,
        };
      })
    );

    res.send(users);
  } catch (e) {
    logger.error(e);
    res.status(500).send([]);
  }
});

module.exports = router;
