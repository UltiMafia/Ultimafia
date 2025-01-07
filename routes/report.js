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
      reportTitle.length < 1 ||
      !report ||
      report.length < 15
    ) {
      // Should send a 400 error code if the report title doesn't meet our requirements
      res
        .status(400)
        .send("Please complete the form with all relevant information..");
      return;
    }

    let ping = "<@&1107343293848768622>\n";
    let title = `[${user.name}] reporting ${req.body.title}`;

    const webhookURL = atob("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTMyNjE4MTE4ODE4Nzk3OTkyOS9NMGNvcUlScnJGSnRCRENxQzgxQlRjLVpKazhLNFV2Wk1iRU5pV3Y4UVRIOENlaV9DcU92bEx2bnBwTmZHNWxFM0UySQ==");

    // Constructs a dynamic message with the report content to send to discord
    await axios({
      method: "POST",
      url: webhookURL,
      data: {
        content: `${ping} ${title}: ${report}`,
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
