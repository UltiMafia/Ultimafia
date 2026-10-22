const models = require("../../db/models");
const redis = require("../redis");
const constants = require("../../data/constants");
const routeUtils = require("../../routes/utils");
const {
  randomToken,
  secretMatches,
  newCredentials,
  keyIsUsable,
} = require("./credentials");

const limits = constants.devApi;
const tokenKey = (token) => `devapi:token:${token}`;
const publicKeyFields = "clientId userId name createdAt expiresAt lastUsedAt revokedAt revokedBy -_id";

async function isActiveDeveloper(userId) {
  if (!userId) return false;
  const user = await models.User.findOne({ id: userId, deleted: false }).select("_id");
  if (!user) return false;
  return (
    (await routeUtils.verifyPermission(userId, "devApi")) &&
    (await routeUtils.verifyPermission(userId, "playGame"))
  );
}

async function createKey(userId, name) {
  const active = await models.DevApiKey.countDocuments({
    userId,
    revokedAt: null,
    expiresAt: { $gt: Date.now() },
  });
  if (active >= limits.maxKeysPerDeveloper)
    throw new RangeError(`You can have at most ${limits.maxKeysPerDeveloper} active keys.`);

  const { clientId, clientSecret, secretHash } = newCredentials();
  const now = Date.now();
  await models.DevApiKey.create({
    clientId,
    secretHash,
    userId,
    name: String(name || "").slice(0, 50),
    createdAt: now,
    expiresAt: now + limits.keyLifetimeMs,
  });
  return { clientId, clientSecret, expiresAt: now + limits.keyLifetimeMs };
}

function listKeys(filter) {
  return models.DevApiKey.find(filter).select(publicKeyFields).sort("-createdAt").lean();
}

async function revokeKeys(filter, revokedBy) {
  const keys = await models.DevApiKey.find({ ...filter, revokedAt: null }).select("clientId");
  await models.DevApiKey.updateMany(
    { clientId: { $in: keys.map((k) => k.clientId) } },
    { $set: { revokedAt: Date.now(), revokedBy } }
  );
  return keys.length;
}

async function exchange(clientId, clientSecret) {
  const key = await models.DevApiKey.findOne({ clientId: String(clientId) });
  const now = Date.now();
  if (!keyIsUsable(key, now) || !secretMatches(clientSecret, key.secretHash))
    return null;
  if (!(await isActiveDeveloper(key.userId))) {
    await revokeKeys({ userId: key.userId }, "system");
    return null;
  }

  const token = randomToken(32);
  await redis.client.setexAsync(
    tokenKey(token),
    limits.tokenTtlSeconds,
    JSON.stringify({ userId: key.userId, clientId: key.clientId })
  );
  await models.DevApiKey.updateOne({ _id: key._id }, { $set: { lastUsedAt: now } });
  return { token, tokenType: "Bearer", expiresIn: limits.tokenTtlSeconds };
}

async function authenticate(token) {
  if (!token) return null;
  const raw = await redis.client.getAsync(tokenKey(token));
  if (!raw) return null;
  const session = JSON.parse(raw);
  const key = await models.DevApiKey.findOne({ clientId: session.clientId }).select(
    "revokedAt expiresAt"
  );
  if (!keyIsUsable(key, Date.now()) || !(await isActiveDeveloper(session.userId))) {
    await redis.client.delAsync(tokenKey(token));
    return null;
  }
  return session;
}

module.exports = {
  isActiveDeveloper,
  createKey,
  listKeys,
  revokeKeys,
  exchange,
  authenticate,
};
