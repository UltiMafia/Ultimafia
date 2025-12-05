const express = require("express");
const shortid = require("shortid");
const routeUtils = require("./utils");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const router = express.Router();
const axios = require("axios");

router.post("/send", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("_id name");

    const { game, user: reportedUser, rule, description } = req.body;

    if (!reportedUser || !rule) {
      return res
        .status(400)
        .send("User and rule broken are required to file a report.");
    }

    // Validate reported user exists
    const reportedUserDoc = await models.User.findOne({
      id: reportedUser,
      deleted: false,
    }).select("id");

    if (!reportedUserDoc) {
      return res.status(400).send("Reported user does not exist.");
    }

    // Validate game exists if provided
    if (game) {
      const gameDoc = await models.Game.findOne({ id: game }).select("id");
      if (!gameDoc) {
        return res.status(400).send("Game does not exist.");
      }
    }

    // Validate rule exists in rulesData
    try {
      const { rulesData } = require("../react_main/src/constants/rules");
      const validRule = rulesData.find((r) => r.name === rule);
      if (!validRule) {
        return res.status(400).send("Invalid rule selected.");
      }
    } catch (e) {
      // If rules file doesn't exist, skip validation
      logger.warn("Could not validate rule:", e);
    }

    // Rate limiting
    if (!(await routeUtils.rateLimit(userId, "fileReport", res))) return;

    // Create report document
    const report = new models.Report({
      id: shortid.generate(),
      reporterId: userId,
      reportedUserId: reportedUser,
      gameId: game || null,
      rule: rule,
      description: description ? String(description).trim().slice(0, 5000) : "",
      status: "open",
      assignees: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [
        {
          status: "open",
          changedBy: userId,
          timestamp: Date.now(),
          action: "created",
          note: "Report created",
        },
      ],
    });

    await report.save();
    logger.info(
      `Report ${report.id} created successfully by user ${userId} for reported user ${reportedUser}`
    );

    // OPTIONAL: Still send to Discord for notification (can be removed later)
    // try {
    //   const title = `[${user.name}] reporting https://ultimafia.com/user/${reportedUser}`;
    //   let reportDetails = `**Rule Broken:** ${rule}\n`;
    //   reportDetails += `**Report ID:** ${report.id}\n`;

    //   if (game) {
    //     reportDetails += `**Game:** https://ultimafia.com/game/${game}\n`;
    //   }

    //   if (description) {
    //     reportDetails += `**Description:** ${description}`;
    //   }

    //   const ping = "<@&1107343293848768622>\n";

    //   // Decode the Base64 webhook URL components
    //   const wht =
    //     "QTQ0dG9WSFA3UUNfSk1KbTZZTFh1Q05JT2xhLVoxanZqczhTRDE3WmQyOGktTU5kYmJlbzFCTVRPQzBnTmJKblMwRGM=";
    //   const whId = "MTMyODgwNjY5OTcxNjMxNzE5NQ==";
    //   const base = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv";

    //   const decodeBase64 = (str) =>
    //     Buffer.from(str, "base64").toString("utf-8");
    //   const webhookURL =
    //     decodeBase64(base) + decodeBase64(whId) + "/" + decodeBase64(wht);

    //   await axios.post(webhookURL, {
    //     content: `${ping}${title}\n${reportDetails}`,
    //     username: "SnitchBot",
    //   });
    // } catch (discordError) {
    //   // Log but don't fail if Discord webhook fails
    //   logger.warn("Failed to send Discord notification:", discordError);
    // }

    res.status(200).send("Report has been filed successfully.");
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error filing report.");
  }
});

module.exports = router;
