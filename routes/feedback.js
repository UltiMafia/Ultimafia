const express = require("express");
const routeUtils = require("./utils");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const router = express.Router();
const axios = require("axios");

router.post("/send", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "_id name"
    );

    let feedbackTitle = req.body.title;
    let feedback = req.body.value;
    //let feedbackType = req.body.type;
    //let feedbackCategory = req.body.category;

    if (!feedbackTitle || feedbackTitle.length < 5 || !feedback || feedback.length < 15) {
      res.status(500);
      res.send("We would appreciate a more meaningful feedback. Please elaborate more.");
      return;
    }
    let title = `[${user.name}] ${req.body.title};`;

    let trelloUrl = `${process.env.TRELLO_API_URL}?key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_API_TOKEN}&idList=${process.env.TRELLO_API_LIST_ID}&name=${title}&desc=${feedback}`;
    var feedbackRes = await axios.post(trelloUrl);
    res.sendStatus(feedbackRes.status);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error sending feedback.");
  }
});

module.exports = router;
