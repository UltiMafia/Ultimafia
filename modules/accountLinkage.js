const models = require("../db/models");
const { normalizeFingerprint } = require("./fingerprintBan");

function normalizedFingerprints(records) {
  const fingerprints = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    const fingerprint = normalizeFingerprint(record);
    if (!fingerprint) continue;
    // Fingerprint values are allowed to contain NUL, so a delimiter-based key
    // could merge two different triples.
    fingerprints.set(JSON.stringify([fingerprint.platform, fingerprint.stable, fingerprint.unstable]), fingerprint);
  }
  return [...fingerprints.values()];
}

function fingerprintKey(fingerprint) {
  return JSON.stringify([fingerprint.platform, fingerprint.stable, fingerprint.unstable]);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Old documents were not normalized at write time. Keep the match to one
// array element while admitting only whitespace variants that normalize to the
// requested triple (and legacy absent/null empty unstable values).
function fingerprintClause(fingerprint) {
  // BSON regular expressions cannot contain NUL; exact matching is still safe
  // for such values and, importantly, does not collapse distinct tuples.
  const field = (value) => value.includes("\u0000") ? value : new RegExp(`^\\s*${escapeRegex(value)}\\s*$`);
  const element = {
    platform: field(fingerprint.platform),
    stable: field(fingerprint.stable),
  };
  if (fingerprint.unstable) element.unstable = field(fingerprint.unstable);
  else element.$or = [{ unstable: { $in: [null, ""] } }, { unstable: /^\s*$/ }];
  return {
    fingerprints: {
      $elemMatch: element,
    },
  };
}

async function getDirectLinkedAccountIds(userId) {
  const user = await models.User.findOne({ id: userId }).select("ip fingerprints").lean();
  if (!user) return [userId];

  const clauses = [];
  if (Array.isArray(user.ip) && user.ip.length > 0) {
    clauses.push({ ip: { $elemMatch: { $in: user.ip } } });
  }

  for (const fingerprint of normalizedFingerprints(user.fingerprints)) {
    clauses.push(fingerprintClause(fingerprint));
  }

  if (clauses.length === 0) return [userId];
  const linkedUsers = await models.User.find({ $or: clauses }).select("id ip fingerprints -_id").lean();
  const sourceFingerprints = new Set(normalizedFingerprints(user.fingerprints).map(fingerprintKey));
  const sourceIps = new Set(Array.isArray(user.ip) ? user.ip : []);
  const ids = new Set(linkedUsers
    .filter((linkedUser) =>
      (Array.isArray(linkedUser.ip) && linkedUser.ip.some((ip) => sourceIps.has(ip))) ||
      normalizedFingerprints(linkedUser.fingerprints).some((fingerprint) => sourceFingerprints.has(fingerprintKey(fingerprint)))
    )
    .map((linkedUser) => linkedUser.id)
    .filter(Boolean));
  ids.add(userId);
  return [...ids];
}

async function removeSharedLinkEvidence(userId1, userId2) {
  const [user1, user2] = await Promise.all([
    models.User.findOne({ id: userId1 }).select("ip fingerprints").lean(),
    models.User.findOne({ id: userId2 }).select("ip fingerprints").lean(),
  ]);
  if (!user1 || !user2) return null;

  const ips2 = new Set(Array.isArray(user2.ip) ? user2.ip : []);
  const ips = [...new Set((Array.isArray(user1.ip) ? user1.ip : []).filter((ip) => ips2.has(ip)))];
  const fingerprints2 = new Map(
    normalizedFingerprints(user2.fingerprints).map((fingerprint) => [
      fingerprintKey(fingerprint),
      fingerprint,
    ])
  );
  const fingerprints = normalizedFingerprints(user1.fingerprints).filter((fingerprint) =>
    fingerprints2.has(fingerprintKey(fingerprint))
  );

  const update = {};
  if (ips.length > 0) update.ip = { $in: ips };
  if (fingerprints.length > 0) {
    update.fingerprints = {
      $or: fingerprints.map((fingerprint) => fingerprintClause(fingerprint).fingerprints.$elemMatch),
    };
  }
  if (Object.keys(update).length > 0) {
    const results = await Promise.all([
      models.User.updateOne({ id: userId1 }, { $pull: update }),
      models.User.updateOne({ id: userId2 }, { $pull: update }),
    ]);
    if (results.some((result) => result.matchedCount !== 1)) return null;
  }
  return { ips, fingerprintCount: fingerprints.length };
}

async function clearAllLinkEvidence() {
  return models.User.updateMany({}, { $unset: { ip: "", fingerprints: "" } }).exec();
}

module.exports = {
  getDirectLinkedAccountIds,
  normalizedFingerprints,
  removeSharedLinkEvidence,
  clearAllLinkEvidence,
};
