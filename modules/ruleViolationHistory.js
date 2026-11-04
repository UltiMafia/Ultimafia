// Whether an account has an abuse violation on record. The abuse chat filter
// starts off and switches on for these accounts; the negative answer is cached
// because /api/user/info is on a hot path.
const models = require("../db/models");

// Violation rules the "abuse" classifier folds together.
const ABUSE_VIOLATIONS = ["personal-attacks-harassment", "intolerance"];
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 5000;
const cache = new Map();

async function hasAbuseViolation(userId) {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const found = await models.ViolationTicket.exists({
    userId,
    violationId: { $in: ABUSE_VIOLATIONS },
  });
  const value = Boolean(found);

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(userId, { value, at: Date.now() });
  return value;
}

function forget(userId) {
  cache.delete(userId);
}

module.exports = { hasAbuseViolation, forget, ABUSE_VIOLATIONS };
