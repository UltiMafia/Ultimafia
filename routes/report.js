const express = require("express");
const shortid = require("shortid");
const routeUtils = require("./utils");
const models = require("../db/models");
const redis = require("../modules/redis");
const logger = require("../modules/logging")(".");
const errors = require("../lib/errors");
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

    // Validate game exists if provided (Mongo for finished/archived games, Redis while live)
    if (game) {
      const gameId = String(game).trim();
      const gameDoc = await models.Game.findOne({ id: gameId }).select("id");
      const live = !gameDoc && (await redis.gameExists(gameId));
      if (!gameDoc && !live) {
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
      logger.warn("Could not validate rule:", e);
      return res.status(503).send(
        "Report rules are temporarily unavailable. Nothing was submitted; your draft is preserved. Please try again later."
      );
    }

    // Rate limiting
    if (!(await routeUtils.rateLimit(userId, "fileReport", res))) return;

    const trimmedDescription = description ? String(description).trim() : "";
    if (trimmedDescription.length > 5000) {
      return res.status(400).send(
        "Report evidence must fit within 5000 characters. Your draft has not been submitted."
      );
    }
    const now = Date.now();

    // Only merge when game is present - never merge non-game reports
    let report;
    let merged = false;

    if (game) {
      // Read raw fields so a missing legacy array remains distinguishable from [].
      const existingReport = await models.Report.findOne({
        reportedUserId: reportedUser,
        gameId: game,
        status: { $in: ["open", "in-progress"] },
      }).lean();

      if (existingReport) {
        const hasReporters =
          Array.isArray(existingReport.reporters) &&
          existingReport.reporters.length > 0;
        const reporters = hasReporters
          ? existingReport.reporters.map((reporter) => ({ ...reporter }))
          : routeUtils.getReportReporters(existingReport);
        const reporter = reporters.find((entry) => entry.userId === userId);
        let action = "reporter_added";

        if (reporter) {
          const previousDescription = reporter.description || "";
          if (reporter.rule === rule && previousDescription === trimmedDescription) {
            return res.status(200).send("This evidence is already stored in the case.");
          }
          const supplement =
            `\n\n--- Additional evidence (${new Date(now).toISOString()}) ---\n` +
            `Rule: ${rule}\n${trimmedDescription}`;
          if (previousDescription.length + supplement.length > 5000) {
            return res.status(409).send(
              "This case already contains evidence from you. The combined evidence would exceed 5000 characters. Nothing was added; keep your draft and shorten the additional evidence."
            );
          }
          reporter.description = previousDescription + supplement;
          action = "evidence_added";
        } else {
          reporters.push({
            userId,
            rule,
            description: trimmedDescription,
            submittedAt: now,
          });
        }

        // Compare the whole observed array to prevent lost additions by other
        // reporters, as well as lost same-reporter evidence. Never auto-replay.
        const filter = {
          _id: existingReport._id,
          status: existingReport.status,
          reporters: existingReport.reporters === undefined
            ? { $exists: false }
            : existingReport.reporters,
        };
        if (!hasReporters) {
          // Legacy evidence is the source of the migrated first entry.
          for (const field of ["reporterId", "rule", "description", "createdAt"]) {
            filter[field] = existingReport[field] === undefined
              ? { $exists: false }
              : existingReport[field];
          }
        }
        // Use the native collection for a literal BSON snapshot comparison.
        // Mongoose subdocument query casting can add absent legacy defaults or
        // _ids to the filter, making an unchanged stored array fail every CAS.
        const updateResult = await models.Report.collection.updateOne(
          filter,
          {
            $set: { reporters, updatedAt: now },
            $push: {
              history: {
                status: existingReport.status,
                changedBy: userId,
                timestamp: now,
                action,
                note: action === "evidence_added"
                  ? "Additional evidence added by an existing reporter"
                  : `Additional report added by ${user.name}`,
              },
            },
          }
        );
        if (updateResult.matchedCount !== 1) {
          return res.status(409).send(
            "The case changed while you were submitting. Nothing was added by this submission. Your draft is preserved; review it before submitting again."
          );
        }
        // No refetch or save: the successful conditional write is the receipt.
        report = existingReport;
        merged = true;
        logger.info(`Report ${report.id} updated: ${action} by user ${userId}`);
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
    errors.serverError(res, "Error filing report. Please try again.");
  }
});

router.post("/volunteer", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("_id name");

    const { age, reason } = req.body;

    if (!reason || !String(reason).trim()) {
      return res
        .status(400)
        .send("Please explain why you want to be a moderator.");
    }

    const ageNum = age != null ? parseInt(age, 10) : null;
    if (ageNum == null || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      return res.status(400).send("Please provide a valid age (13-120).");
    }

    // Rate limiting
    if (!(await routeUtils.rateLimit(userId, "staffApplication", res)))
      return;

    const trimmedReason = String(reason).trim().slice(0, 1500);

    try {
      const title = `Staff application from ${user.name}: https://ultimafia.com/user/${userId}`;
      let details = `\nAge: ${ageNum}`;
      details += `\n\nWhy they want to be a moderator:\n${trimmedReason}`;

      const ping = "<@&1107343293848768622>\n";

      const wht =
        "QTQ0dG9WSFA3UUNfSk1KbTZZTFh1Q05JT2xhLVoxanZqczhTRDE3WmQyOGktTU5kYmJlbzFCTVRPQzBnTmJKblMwRGM=";
      const whId = "MTMyODgwNjY5OTcxNjMxNzE5NQ==";
      const base = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv";

      const decodeBase64 = (str) =>
        Buffer.from(str, "base64").toString("utf-8");
      const webhookURL =
        decodeBase64(base) + decodeBase64(whId) + "/" + decodeBase64(wht);

      await axios.post(webhookURL, {
        content: `${ping}${title}${details}`,
        username: "SnitchBot",
      });
    } catch (discordError) {
      logger.warn("Failed to send staff application Discord notification:", discordError);
    }

    logger.info(`Staff application submitted by user ${userId} (${user.name})`);

    res.status(200).send("Your application has been submitted successfully.");
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("You must be logged in to apply.");
    }
    logger.error(e);
    errors.serverError(res, "Error submitting application. Please try again.");
  }
});

async function sendFlaggedUserDiscordAlert(userName, odlld, reason) {
  try {
    const flaggedUserCount = await models.User.countDocuments({
      flagged: true,
    });

    const title = `New flagged user registered: ${userName}`;
    let details = `\nUser ID: ${odlld}`;
    details += `\nReason: ${reason}`;
    details += `\nProfile: https://ultimafia.com/user/${odlld}`;
    details += `\nTotal flagged users: ${flaggedUserCount}`;
    details += `\nReview at: https://ultimafia.com/policy/moderation/flagged-intake`;

    const ping = "<@&1107343293848768622>\n";

    const wht =
      "QTQ0dG9WSFA3UUNfSk1KbTZZTFh1Q05JT2xhLVoxanZqczhTRDE3WmQyOGktTU5kYmJlbzFCTVRPQzBnTmJKblMwRGM=";
    const whId = "MTMyODgwNjY5OTcxNjMxNzE5NQ==";
    const base = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv";

    const decodeBase64 = (str) => Buffer.from(str, "base64").toString("utf-8");
    const webhookURL =
      decodeBase64(base) + decodeBase64(whId) + "/" + decodeBase64(wht);

    await axios.post(webhookURL, {
      content: `${ping}${title}${details}`,
      username: "FlagBot",
    });
  } catch (discordError) {
    logger.warn("Failed to send flagged user Discord notification:", discordError);
  }
}

module.exports = router;
module.exports.sendFlaggedUserDiscordAlert = sendFlaggedUserDiscordAlert;
