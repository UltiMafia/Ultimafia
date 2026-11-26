const models = require("../db/models");
const { accountLinkEvidenceKeys } = require("./accountLinkage");

const ADMIN_GROUP = "Admin";
const ADMIN_GROUPS = ["Owner", ADMIN_GROUP];
const MAX_NOMINEES = 20;
const MAX_TERM_DAYS = 365;
const DAY = 24 * 60 * 60 * 1000;

function activeTermQuery() {
  return { termEndsAt: { $gt: new Date() } };
}

function hasActiveTerm(userId) {
  return models.AdminElection.exists({ winnerId: userId, ...activeTermQuery() });
}

function activeElectedAdminIds() {
  return models.AdminElection.distinct("winnerId", activeTermQuery());
}

async function isElectionAdmin(user) {
  const [groups, elected] = await Promise.all([
    models.Group.find({ name: { $in: ADMIN_GROUPS } }).select("name"),
    hasActiveTerm(user.id),
  ]);
  if (elected && groups.some((group) => group.name === ADMIN_GROUP)) return true;
  return !!(await models.InGroup.exists({
    user: user._id,
    group: { $in: groups.map((group) => group._id) },
  }));
}

function electionPhase(election, now) {
  if (election.certifiedAt) return "certified";
  if (now < election.votingStartsAt) return "nominations";
  if (now < election.votingEndsAt) return "voting";
  return "awaitingCertification";
}

async function countableRankings(ballots, ballotOrder) {
  const voterIds = Object.keys(ballots);
  if (voterIds.length === 0) return [];
  const voters = await models.User.find({ _id: { $in: voterIds } })
    .select("ip fingerprints").lean();
  const evidenceByVoter = new Map(voters.map((user) => [
    user._id.toString(), accountLinkEvidenceKeys(user),
  ]));
  // Vote order is fixed on the first save. Ballots from before order was
  // tracked precede new ballots, with a deterministic order among themselves.
  voterIds.sort((a, b) => (ballotOrder[a] ?? 0) - (ballotOrder[b] ?? 0) || a.localeCompare(b));
  const countedEvidence = new Set();
  const rankings = [];
  for (const voterId of voterIds) {
    const evidence = evidenceByVoter.get(voterId) || [];
    if (evidence.some((key) => countedEvidence.has(key))) continue;
    for (const key of evidence) countedEvidence.add(key);
    rankings.push(ballots[voterId]);
  }
  return rankings;
}

function countRankedBallots(nomineeIds, ballots) {
  const remaining = new Set(nomineeIds);
  while (remaining.size) {
    const counts = new Map([...remaining].map((id) => [id, 0]));
    let activeBallots = 0;
    for (const ranking of ballots) {
      const first = ranking.find((id) => remaining.has(id));
      if (!first) continue;
      counts.set(first, counts.get(first) + 1);
      activeBallots++;
    }
    if (!activeBallots) break;

    const ordered = [...counts].sort((a, b) => a[1] - b[1]);
    const [leader, highestCount] = ordered[ordered.length - 1];
    if (highestCount > activeBallots / 2)
      return { outcome: "elected", winnerId: leader };

    const lowestCount = ordered[0][1];
    const lowest = ordered.filter(([, count]) => count === lowestCount);
    const nextCount = ordered[lowest.length]?.[1];
    // Tied last-place candidates may be eliminated together only if their
    // combined votes cannot catch the next candidate in any elimination order.
    if (nextCount === undefined || lowest.length * lowestCount >= nextCount)
      return { outcome: "tie" };
    for (const [id] of lowest) remaining.delete(id);
  }
  return { outcome: "noVotes" };
}

module.exports = {
  ADMIN_GROUP,
  MAX_NOMINEES,
  MAX_TERM_DAYS,
  DAY,
  hasActiveTerm,
  activeElectedAdminIds,
  isElectionAdmin,
  electionPhase,
  countableRankings,
  countRankedBallots,
};
