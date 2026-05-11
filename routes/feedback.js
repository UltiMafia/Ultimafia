const express = require("express");
const routeUtils = require("./utils");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const errors = require("../lib/errors");
const router = express.Router();

const VALID_TYPES = ["bug", "suggestion"];
const VALID_CATEGORIES = [
  "general",
  "mafia",
  "minigames",
  "competitive",
  "forum",
  "moderation",
  "other",
];

const TYPE_LABELS = {
  bug: "Bug Report",
  suggestion: "Suggestion",
};

const CATEGORY_LABELS = {
  general: "General",
  mafia: "Mafia",
  minigames: "Minigames",
  competitive: "Competitive",
  forum: "Forum",
  moderation: "Moderation",
  other: "Other",
};

const GITHUB_OWNER = process.env.GITHUB_FEEDBACK_OWNER || "ultimafia";
const GITHUB_REPO = process.env.GITHUB_FEEDBACK_REPO || "ultimafia";

function getGithubToken() {
  return (
    process.env.GITHUB_ACCESS_TOKEN ||
    process.env.GITHUB_TOKEN ||
    ""
  );
}

let octokitPromise = null;
async function getOctokit() {
  const token = getGithubToken();
  if (!token) {
    throw new Error("GitHub feedback integration is not configured.");
  }
  if (!octokitPromise) {
    octokitPromise = import("@octokit/core").then(
      ({ Octokit }) =>
        new Octokit({
          auth: token,
          userAgent: "ultimafia-feedback",
        })
    );
  }
  return octokitPromise;
}

router.post("/submit", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("_id name");

    const { title, type, category, description } = req.body;

    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    const trimmedDescription =
      typeof description === "string" ? description.trim() : "";

    if (!trimmedTitle) {
      return res.status(400).send("Please provide a title for your feedback.");
    }
    if (trimmedTitle.length > 120) {
      return res.status(400).send("Title must be 120 characters or fewer.");
    }
    if (!VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .send("Please select whether this is a bug report or suggestion.");
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).send("Please select a valid category.");
    }
    if (!trimmedDescription) {
      return res.status(400).send("Please describe your feedback.");
    }

    const finalDescription = trimmedDescription.slice(0, 5000);

    if (!(await routeUtils.rateLimit(userId, "feedbackSubmission", res))) {
      return;
    }

    const typeLabel = TYPE_LABELS[type];
    const categoryLabel = CATEGORY_LABELS[category];
    const issueTitle = `[${typeLabel}] ${trimmedTitle}`;
    const issueBody =
      `**Submitted by:** ${user.name} ([profile](https://ultimafia.com/user/${userId}))\n` +
      `**Type:** ${typeLabel}\n` +
      `**Category:** ${categoryLabel}\n\n` +
      `---\n\n` +
      `${finalDescription}`;

    let issueUrl = null;

    try {
      const octokit = await getOctokit();
      const response = await octokit.request(
        "POST /repos/{owner}/{repo}/issues",
        {
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          title: issueTitle,
          body: issueBody,
          labels: ["user-submitted"],
        }
      );
      issueUrl = response?.data?.html_url || null;
      logger.info(
        `Feedback issue #${response?.data?.number} created by user ${userId} (${user.name})`
      );
    } catch (githubError) {
      const status = githubError?.status || githubError?.response?.status;
      logger.error(
        `Failed to create GitHub feedback issue (status ${status}): ${
          githubError?.message || githubError
        }`
      );
      return errors.serverError(
        res,
        "Could not submit feedback to GitHub right now. Please try again later."
      );
    }

    res
      .status(200)
      .send(
        issueUrl
          ? `Your feedback has been submitted: ${issueUrl}`
          : "Your feedback has been submitted."
      );
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("You must be logged in to submit feedback.");
    }
    logger.error(e);
    errors.serverError(res, "Error submitting feedback. Please try again.");
  }
});

module.exports = router;
