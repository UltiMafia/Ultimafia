const express = require("express");
const routeUtils = require("./utils");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const router = express.Router();
const axios = require("axios");
const { Octokit } = require("@octokit/core");

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

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
      res.status(500);
      res.send(
        "Please complete the form with all relevant information.."
      );
      return;
    }

    let title = `site:[${user.name}] ${req.body.title}`;
    let reportRes = await octokit.request(
      "POST /repos/UltiMafia/Ultimafia/issues",
      {
        owner: "UltiMafia",
        repo: "Ultimafia",
        title: title,
        body: report,
        labels: ["form submitted"],
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    res.sendStatus(reportRes.status);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error sending report.");
  }
});

module.exports = router;
