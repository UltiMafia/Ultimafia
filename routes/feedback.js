const express = require("express");
const routeUtils = require("./utils");
const models = require("../db/models");
const logger = require("../modules/logging")(".");

const router = express.Router();
const axios = require("axios");

router.post("/send", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("_id name");

    const feedbackTitle = req.body.title;
    const feedback = req.body.value;
    // let feedbackType = req.body.type;
    // let feedbackCategory = req.body.category;

    if (
      !feedbackTitle ||
      feedbackTitle.length < 5 ||
      !feedback ||
      feedback.length < 15
    ) {
      res.status(500);
      res.send(
        "We would appreciate a more meaningful feedback. Please elaborate more."
      );
      return;
    }
    const title = `[${user.name}] ${req.body.title};`;

    const trelloUrl = `${process.env.TRELLO_API_URL}?key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_API_TOKEN}&idList=${process.env.TRELLO_API_LIST_ID}&name=${title}&desc=${feedback}`;
    const feedbackRes = await axios.post(trelloUrl);
    res.sendStatus(feedbackRes.status);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error sending feedback.");
  }
});

module.exports = router;
