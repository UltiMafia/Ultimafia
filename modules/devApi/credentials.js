const crypto = require("crypto");

function randomToken(bytes) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function hashSecret(secret) {
  return crypto.createHash("sha256").update(String(secret)).digest("hex");
}

function secretMatches(secret, secretHash) {
  const actual = Buffer.from(hashSecret(secret), "hex");
  const expected = Buffer.from(String(secretHash || ""), "hex");
  return (
    actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
  );
}

function newCredentials() {
  const clientId = `ufd_${randomToken(12)}`;
  const clientSecret = randomToken(32);
  return { clientId, clientSecret, secretHash: hashSecret(clientSecret) };
}

function keyIsUsable(key, now) {
  return Boolean(key) && !key.revokedAt && key.expiresAt > now;
}

module.exports = {
  randomToken,
  hashSecret,
  secretMatches,
  newCredentials,
  keyIsUsable,
};
