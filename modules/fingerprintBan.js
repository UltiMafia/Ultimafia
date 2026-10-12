const models = require("../db/models");

function normalizeFingerprint(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { platform, stable, unstable } = raw;
  if (typeof platform !== "string" || typeof stable !== "string") return null;
  if (unstable != null && typeof unstable !== "string") return null;
  const values = { platform: platform.trim(), stable: stable.trim(), unstable: unstable == null ? "" : unstable.trim() };
  if (!values.platform || !values.stable || values.platform.length > 32 || values.stable.length > 128 || values.unstable.length > 128) return null;
  return values;
}

function classifyFingerprintMatch(records, fp) {
  let stableMatch = false;
  for (const record of records || []) {
    if (record.platform !== fp.platform || record.stable !== fp.stable) continue;
    if ((record.unstable || "") === fp.unstable) return "block";
    stableMatch = true;
  }
  return stableMatch ? "restrict" : null;
}

async function checkFingerprintBan(fp) {
  const users = await models.User.find({ banned: true, "fingerprints.stable": fp.stable }).select("fingerprints").lean();
  const records = users.flatMap((user) => user.fingerprints || []);
  return classifyFingerprintMatch(records, fp);
}

module.exports = { normalizeFingerprint, classifyFingerprintMatch, checkFingerprintBan };
