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
    let reportEvidence = req.body.evidence;
    let report = req.body.value;

    if (
      !reportTitle ||
      reportTitle.length < 5 ||
      !reportEvidence ||
      reportEvidence.length < 5 ||
      !report ||
      report.length < 15 
    ) {
      // Send a 400 error code if the report contents don't meet our requirements
      res.status(400).send("ERROR: Report title and evidence must be greater than 5 characters. Description must be greater than 15 characters.");
      return;
    }

    let ping = "<@&1107343293848768622>";
    let title = `[${user.name}] reporting ${reportTitle}`;

    // Ensures the report goes to mod chat
    let webhookURL = 'https://discord.com/api/webhooks/1255571211950489662/tUAchIDAs1gQ6MU6F0Vfp5vyojPTHcaEu_JK6xZdHMKUzCenX6CMbBoqPDUFbaNC4_Wk';

    // Constructs a dynamic message with the report content to send to Discord
    let messageContent = `${ping}\n${title} for ${reportEvidence}\n**Description:** ${report}`;
    await axios({
      method: "POST",
      url: process.env.DISCORD_GAME_HOOK,
      data: {
        content: messageContent,
        username: "SnitchBot",
      },
    });

    // Confirms the report has been successfully sent
    res.status(200).send("Report has been sent to mod chat!");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error sending report.");
  }
});

module.exports = router;
