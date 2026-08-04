/**
 * Former eligibility sync for Ranked Player / Competitive Player groups.
 * Access is no longer gated by games played, fortune points, or those groups;
 * playRanked / playCompetitive are default perms (revoked only by bans).
 * Kept as a no-op so existing callers remain safe.
 */
async function syncRankedCompetitiveAccess(userId, options = {}) {
  return {
    changed: false,
    rankedGranted: false,
    competitiveGranted: false,
    gamesPlayed: 0,
    points: 0,
  };
}

module.exports = {
  syncRankedCompetitiveAccess,
};
