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
    }).select("id name");

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

    // Validate rule exists
    try {
      const { violationDefinitions } = require("../data/violations");
      const validRule = violationDefinitions.find((r) => r.name === rule);
      if (!validRule) {
        return res.status(400).send("Invalid rule selected.");
      }
    } catch (e) {
      // If rules file doesn't exist, skip validation
      logger.warn("Could not validate rule:", e);
    }

    // Rate limiting
    if (!(await routeUtils.rateLimit(userId, "fileReport", res))) return;

    const trimmedDescription = description
      ? String(description).trim().slice(0, 5000)
      : "";
    const now = Date.now();

    // Only merge when game is present - never merge non-game reports
    let report;
    let merged = false;

    if (game) {
      const existingReport = await models.Report.findOne({
        reportedUserId: reportedUser,
        gameId: game,
        status: { $in: ["open", "in-progress"] },
      });

      if (existingReport) {
        report = existingReport;

        // Migrate legacy report to reporters array if needed
        if (!report.reporters || !Array.isArray(report.reporters)) {
          report.reporters = [
            {
              userId: report.reporterId,
              rule: report.rule || "",
              description: report.description || "",
              submittedAt: report.createdAt || now,
            },
          ];
        }

        // Avoid duplicate reporter - only add if this user hasn't already reported
        const alreadyReported = report.reporters.some(
          (r) => r.userId === userId
        );
        if (!alreadyReported) {
          report.reporters.push({
            userId,
            rule,
            description: trimmedDescription,
            submittedAt: now,
          });
          report.updatedAt = now;
          report.history = report.history || [];
          report.history.push({
            status: report.status,
            changedBy: userId,
            timestamp: now,
            action: "reporter_added",
            note: `Additional report added by ${user.name}`,
          });
        }

        await report.save();
        merged = true;
        logger.info(
          `Report ${report.id} updated: user ${userId} added as reporter for reported user ${reportedUser} in game ${game}`
        );
      }
    }

    if (!report) {
      // Create new report
      report = new models.Report({
        id: shortid.generate(),
        reporterId: userId,
        reportedUserId: reportedUser,
        gameId: game || null,
        rule: rule,
        description: trimmedDescription,
        reporters: [
          {
            userId,
            rule,
            description: trimmedDescription,
            submittedAt: now,
          },
        ],
        status: "open",
        assignees: [],
        createdAt: now,
        updatedAt: now,
        history: [
          {
            status: "open",
            changedBy: userId,
            timestamp: now,
            action: "created",
            note: "Report created",
          },
        ],
      });

      await report.save();
      logger.info(
        `Report ${report.id} created successfully by user ${userId} for reported user ${reportedUser}`
      );
    }

    try {
      // Only send Discord notification for new reports, not when merged into existing
      if (!merged) {
        // Get report counts
        const openReportCount = await models.Report.countDocuments({
          status: "open",
        });
        const inProgressReportCount = await models.Report.countDocuments({
          status: "in-progress",
        });

        const title = `${user.name} reporting ${reportedUserDoc.name}: https://ultimafia.com/policy/reports/${report.id}`;
        let reportDetails = `\nNumber of open reports: ${openReportCount}\n`;
        reportDetails += `Number of in-progress reports: ${inProgressReportCount}`;

        const ping = "<@&1107343293848768622>\n";

        // Decode the Base64 webhook URL components
        const wht =
          "QTQ0dG9WSFA3UUNfSk1KbTZZTFh1Q05JT2xhLVoxanZqczhTRDE3WmQyOGktTU5kYmJlbzFCTVRPQzBnTmJKblMwRGM=";
        const whId = "MTMyODgwNjY5OTcxNjMxNzE5NQ==";
        const base = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv";

        const decodeBase64 = (str) =>
          Buffer.from(str, "base64").toString("utf-8");
        const webhookURL =
          decodeBase64(base) + decodeBase64(whId) + "/" + decodeBase64(wht);

        await axios.post(webhookURL, {
          content: `${ping}${title}${reportDetails}`,
          username: "SnitchBot",
        });
      }
    } catch (discordError) {
      // Log but don't fail if Discord webhook fails
      logger.warn("Failed to send Discord notification:", discordError);
    }

    res
      .status(200)
      .send(
        merged
          ? "Your report has been added to an existing case for this game."
          : "Report has been filed successfully."
      );
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error filing report.");
  }
});

module.exports = router;
