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

    let reportTitle = req.body.title;
    let report = req.body.value;

    if (
      !reportTitle ||
      reportTitle.length < 5 ||
      !report ||
      report.length < 15 
    ) {
      // Should send a 400 error code if the report contents doesn't meet our requirements
      res.status(400).send("ERROR: Report title must be longer than 5 characters. Description must be longer than 15 characters.");
      return;
    }

    let ping = "<@&1107343293848768622>\n";
    let title = `[${user.name}] reporting ${req.body.title}`;
    await axios({
      method: "POST",
      url: process.env.DISCORD_GAME_HOOK,
      data: {
        content: `${ping} ${title}: ${report}`,
        username: "SnitchBot",
      },
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error sending report.");
  }
});

module.exports = router;
