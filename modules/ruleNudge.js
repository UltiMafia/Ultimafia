// Retrospective PA&H nudge: count messages the game actually accepted, not
// checks the client asked for. `/api/rules/check` issues a single-use token
// carrying its verdict; the games process consumes it inside `Meeting.speak`
// and counts only there. A cancelled dialog, a cooldown, a mute or a client
// that never sends leaves the token unused and uncounted.
const crypto = require("crypto");
const {
  FLAG_THRESHOLD,
  ABUSE_PROBABILITY,
  NUDGE_TEXT,
  noteVerdict: decide,
} = require("./ruleNudgePolicy");

// Loaded lazily: this module is required by Games/core/Game.js, and loading
// modules/redis.js opens a connection immediately. Tests (and the CI runner)
// have no `redis` host, so an eager require broke the whole suite.
let redisClient = null;
function db() {
  if (!redisClient) redisClient = require("./redis");
  return redisClient;
}

const TOKEN_TTL_SECONDS = 600;
const COUNTER_TTL_SECONDS = 12 * 60 * 60;

async function issueToken({
  userId,
  gameId,
  category,
  prob,
  abuseProb,
  abusePrompt,
}) {
  if (!userId || !gameId) return null;

  const token = crypto.randomBytes(12).toString("hex");
  const payload = JSON.stringify({
    u: userId,
    g: gameId,
    c: category,
    p: prob,
    // Abuse-class probability, distinct from p (any violation). Tokens issued
    // before this field existed carry none and are treated as not abuse.
    a: abuseProb,
    // True when the pre-send abuse prompt is enabled: those players already
    // saw the dialog, so they are not nudged afterwards.
    e: Boolean(abusePrompt),
  });

  await db().client.setAsync(
    `rl:verdict:${token}`,
    payload,
    "EX",
    TOKEN_TTL_SECONDS
  );

  return token;
}

// GET and DEL in one round trip: with separate calls, two consumers could both
// read the verdict before either deletes it, and a duplicated message would
// count twice.
const TAKE_VERDICT_SCRIPT =
  "local v = redis.call('GET', KEYS[1]) " +
  "if v then redis.call('DEL', KEYS[1]) end " +
  "return v";

// Single use: the token is removed whether or not it counts, so a duplicated
// or replayed message cannot be counted twice.
async function takeToken(token) {
  if (!token || typeof token !== "string") return null;

  const key = `rl:verdict:${token}`;
  const raw = await db().client.evalAsync(TAKE_VERDICT_SCRIPT, 1, key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function countFlag(gameId, userId) {
  const key = `rl:flags:${gameId}:${userId}`;
  const count = await db().client.incrAsync(key);
  if (count === 1) await db().client.expireAsync(key, COUNTER_TTL_SECONDS);
  return count;
}

// One nudge per player per game.
async function claimNudge(gameId, userId) {
  const key = `rl:nudged:${gameId}:${userId}`;
  const result = await db().client.setAsync(
    key,
    "1",
    "NX",
    "EX",
    COUNTER_TTL_SECONDS
  );
  return result === "OK";
}

// Redis-backed store for the policy in ruleNudgePolicy.js.
function noteVerdict(input) {
  return decide(input, { takeToken, countFlag, claimNudge });
}

module.exports = {
  FLAG_THRESHOLD,
  ABUSE_PROBABILITY,
  NUDGE_TEXT,
  issueToken,
  takeToken,
  countFlag,
  claimNudge,
  noteVerdict,
};
