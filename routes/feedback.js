const crypto = require("crypto");
const fs = require("fs");
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
const GITHUB_APP_ID =
  process.env.GITHUB_FEEDBACK_APP_ID ||
  process.env.GITHUB_APP_ID ||
  "3712085";
const GITHUB_INSTALLATION_ID =
  process.env.GITHUB_FEEDBACK_INSTALLATION_ID ||
  process.env.GITHUB_APP_INSTALLATION_ID ||
  "132300767";

function getGithubToken() {
  return (
    process.env.GITHUB_ACCESS_TOKEN ||
    process.env.GITHUB_TOKEN ||
    ""
  );
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getGithubAppPrivateKey() {
  const privateKey =
    process.env.GITHUB_FEEDBACK_PRIVATE_KEY ||
    process.env.GITHUB_APP_PRIVATE_KEY ||
    "";
  if (privateKey.trim()) {
    return privateKey.replace(/\\n/g, "\n");
  }

  const privateKeyPath =
    process.env.GITHUB_FEEDBACK_PRIVATE_KEY_PATH ||
    process.env.GITHUB_APP_PRIVATE_KEY_PATH ||
    "";
  if (privateKeyPath.trim()) {
    return fs.readFileSync(privateKeyPath, "utf8");
  }

  return "";
}

function createGithubAppJwt() {
  const privateKey = getGithubAppPrivateKey();
  if (!GITHUB_APP_ID || !GITHUB_INSTALLATION_ID || !privateKey) {
    throw new Error("GitHub feedback integration is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: GITHUB_APP_ID,
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto
    .sign("RSA-SHA256", Buffer.from(unsignedToken), privateKey)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsignedToken}.${signature}`;
}

let octokitConstructorPromise = null;
async function getOctokitConstructor() {
  if (!octokitConstructorPromise) {
    octokitConstructorPromise = import("@octokit/core").then(
      ({ Octokit }) => Octokit
    );
  }
  return octokitConstructorPromise;
}

async function createOctokit(auth) {
  const Octokit = await getOctokitConstructor();
  return new Octokit({
    auth,
    userAgent: "ultimafia-feedback",
  });
}

let installationTokenPromise = null;
let cachedInstallationToken = null;
let cachedInstallationTokenExpiresAt = 0;

async function getGithubAppInstallationToken() {
  if (
    cachedInstallationToken &&
    cachedInstallationTokenExpiresAt > Date.now() + 60 * 1000
  ) {
    return cachedInstallationToken;
  }

  if (!installationTokenPromise) {
    installationTokenPromise = (async () => {
      const jwt = createGithubAppJwt();
      const octokit = await createOctokit();
      const response = await octokit.request(
        "POST /app/installations/{installation_id}/access_tokens",
        {
          installation_id: Number(GITHUB_INSTALLATION_ID),
          headers: {
            authorization: `Bearer ${jwt}`,
            "x-github-api-version": "2022-11-28",
          },
        }
      );

      cachedInstallationToken = response.data.token;
      cachedInstallationTokenExpiresAt = Date.parse(response.data.expires_at);
      return cachedInstallationToken;
    })();

    installationTokenPromise.finally(() => {
      installationTokenPromise = null;
    });
  }

  return installationTokenPromise;
}

async function getOctokit() {
  const privateKey = getGithubAppPrivateKey();
  if (GITHUB_APP_ID && GITHUB_INSTALLATION_ID && privateKey) {
    const installationToken = await getGithubAppInstallationToken();
    if (!installationToken) {
      throw new Error("GitHub feedback integration is not configured.");
    }

    return createOctokit(installationToken);
  }

  const token = getGithubToken();
  if (token) {
    return createOctokit(token);
  }

  throw new Error("GitHub feedback integration is not configured.");
}

router.post("/submit", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("_id name");

    if (!user) {
      return res.status(404).send("Could not find your user account.");
    }

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
