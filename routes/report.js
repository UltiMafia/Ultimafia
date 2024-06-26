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
      reportEvidence.length < 15
      !report ||
      report.length < 15 
    ) {
      // Should send a 400 error code if the report title doesn't meet our requirements
      res.status(400).send("Please complete the form with all relevant information.");
      return;
    }
    
    let ping = "<@&1107343293848768622>\n";
    let title = `[${user.name}] reporting ${req.body.title}`;

    // Ensures the report goes to mod chat
    let webhookURL = 'https://discord.com/api/webhooks/1255571211950489662/tUAchIDAs1gQ6MU6F0Vfp5vyojPTHcaEu_JK6xZdHMKUzCenX6CMbBoqPDUFbaNC4_Wk';

    // Constructs a dynamic message with the report content to send to discord
    await axios({
      method: "POST",
      url: webhookURL,
      data: {
        content: `${ping} ${title} for ${report}. Evidence: ${reportEvidence}`,
        username: "SnitchBot",
      },
    });
    // Confirms the report has been successfully sent
    res.status(200).send("Report has been sent to mod chat!");
    // Handles an error with sending the report
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error sending report.");
  }
});

module.exports = router;
