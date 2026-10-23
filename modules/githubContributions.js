const models = require("../db/models");
const logger = require("./logging")(".");

const repo = "UltiMafia/Ultimafia";
const apiBase = "https://api.github.com";
const usernamePattern = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const syncIntervalMs = 24 * 60 * 60 * 1000;
const statuses = ["pending", "approved", "rejected"];

function lineContributions({ additions = 0, deletions = 0 }) {
  return additions + deletions;
}

function isValidUsername(username) {
  return usernamePattern.test(username);
}

function headers() {
  const result = {
    accept: "application/vnd.github+json",
    "user-agent": "UltiMafia-contributors",
    "x-github-api-version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) result.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return result;
}

async function github(path) {
  return fetch(`${apiBase}${path}`, { headers: headers() });
}

async function findGithubLogin(username) {
  if (!isValidUsername(username)) return null;
  const res = await github(`/users/${encodeURIComponent(username)}`);
  if (res.status == 404) return null;
  if (!res.ok) throw new Error(`GitHub user lookup failed with ${res.status}`);
  const body = await res.json();
  return body.type == "User" ? body.login : null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchContributorStats({ attempts = 6, waitMs = 5000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await github(`/repos/${repo}/stats/contributors`);
    if (res.status == 200) return res.json();
    if (res.status == 204) return [];
    if (res.status != 202) throw new Error(`GitHub contributor stats failed with ${res.status}`);
    await sleep(waitMs * attempt);
  }
  throw new Error("GitHub is still computing contributor stats; try again later.");
}

function summarize(stats) {
  const totals = new Map();
  for (const entry of stats) {
    if (!entry.author || !entry.author.login) continue;
    const sum = { additions: 0, deletions: 0, commits: entry.total || 0 };
    for (const week of entry.weeks || []) {
      sum.additions += week.a || 0;
      sum.deletions += week.d || 0;
    }
    totals.set(entry.author.login.toLowerCase(), sum);
  }
  return totals;
}

async function syncContributions(options) {
  const users = await models.User.find({ "github.status": "approved", deleted: false }).select("id github.username");
  if (users.length == 0) return { users: 0 };
  const totals = summarize(await fetchContributorStats(options));
  const now = Date.now();
  for (const user of users) {
    const sum = totals.get(user.github.username.toLowerCase()) || { additions: 0, deletions: 0, commits: 0 };
    await models.User.updateOne(
      { id: user.id },
      {
        $set: {
          "github.additions": sum.additions,
          "github.deletions": sum.deletions,
          "github.commits": sum.commits,
          "github.lastSynced": now,
        },
      }
    );
  }
  return { users: users.length, contributors: totals.size };
}

function sortContributors(contributors) {
  const linked = contributors.filter((c) => c.github);
  const unlinked = contributors.filter((c) => !c.github);
  linked.sort((a, b) => b.github.lines - a.github.lines);
  return linked.concat(unlinked);
}

function syncEnabled() {
  return process.env.GITHUB_SYNC_ENABLED != "false";
}

async function syncIfDue() {
  if (!syncEnabled()) return null;
  const stale = await models.User.exists({
    "github.status": "approved",
    deleted: false,
    $or: [{ "github.lastSynced": null }, { "github.lastSynced": { $lt: Date.now() - syncIntervalMs } }],
  });
  if (!stale) return null;
  try {
    return await syncContributions();
  } catch (e) {
    logger.error(e);
    return null;
  }
}

module.exports = {
  repo,
  statuses,
  lineContributions,
  isValidUsername,
  findGithubLogin,
  fetchContributorStats,
  summarize,
  sortContributors,
  syncContributions,
  syncIfDue,
  syncEnabled,
};
