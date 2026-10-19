const models = require("../db/models");
const { normalizeFingerprint } = require("./fingerprintBan");

async function recordLoginFingerprint(userId, rawFingerprint) {
  const fingerprint = normalizeFingerprint(rawFingerprint);
  if (!fingerprint) return null;
  await models.User.updateOne(
    { id: userId },
    { $addToSet: { fingerprints: fingerprint } }
  );
  return fingerprint;
}

module.exports = { recordLoginFingerprint };
