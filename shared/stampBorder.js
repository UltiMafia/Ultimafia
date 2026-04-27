// Pure helpers for stamp borderType — used by routes/stampTrades.js (trade
// selection priority) and tested in isolation in test/stampTrades.test.js.
// Keep this file dependency-free so it stays trivially unit-testable.

const TIER_RANK = { u: 0, r: 1, c: 2 };

function tierRank(borderType) {
  return TIER_RANK[borderType] ?? 0;
}

function maxTier(a, b) {
  return tierRank(b) > tierRank(a) ? b : a;
}

// Given the user's stamps of a given (gameType, role) and the set of stamp
// ids currently locked in active trades, return the candidate stamp ids in
// trade-preference order: lowest borderType tier first (so traders keep their
// rare/competitive copies). Ties preserve input order.
//
// `stamps` items must expose `_id` and optional `borderType` (defaults to "u").
// `lockedIds` is a Set of stringified stamp ids.
function pickAvailableStampIds(stamps, lockedIds) {
  return stamps
    .filter((s) => !lockedIds.has(String(s._id)))
    .map((s, i) => ({ id: String(s._id), tier: tierRank(s.borderType), i }))
    .sort((a, b) => a.tier - b.tier || a.i - b.i)
    .map((x) => x.id);
}

module.exports = {
  TIER_RANK,
  tierRank,
  maxTier,
  pickAvailableStampIds,
};
