const express = require("express");
const routeUtils = require("./utils");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const router = express.Router();
const axios = require("axios");

router.post("/send", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({ id: userId, deleted: false }).select(
      "_id name"
    );

    const { game, user: reportedUser, rule, description } = req.body;

    if (!reportedUser || !rule) {
      return res.status(400).send("User and rule broken are required to file a report.");
    }

    const title = `[${user.name}] reporting ${reportedUser}`;
    let reportDetails = `**Rule Broken:** ${rule}\n`;

    if (game) {
      reportDetails += `**Game:** ${game}\n`;
    }

    if (description) {
      reportDetails += `**Description:** ${description}`;
    }

    const ping = "<@&1107343293848768622>\n";

    // Decode the Base64 webhook URL components
    const wht =
      "QTQ0dG9WSFA3UUNfSk1KbTZZTFh1Q05JT2xhLVoxanZqczhTRDE3WmQyOGktTU5kYmJlbzFCTVRPQzBnTmJKblMwRGM=";
    const whId = "MTMyODgwNjY5OTcxNjMxNzE5NQ==";
    const base = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv";

    const decodeBase64 = (str) => Buffer.from(str, "base64").toString("utf-8");
    const webhookURL =
      decodeBase64(base) + decodeBase64(whId) + "/" + decodeBase64(wht);

    await axios.post(webhookURL, {
      content: `${ping}${title}\n${reportDetails}`,
      username: "SnitchBot",
    });

    res.status(200).send("Report has been sent to mod chat!");
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error sending report.");
  }
});

module.exports = router;
