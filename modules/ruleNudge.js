// Retrospective PA&H nudge: count messages the game actually accepted, not
// checks the client asked for. `/api/rules/check` issues a single-use token
// carrying its verdict; the games process consumes it inside `Meeting.speak`
// and counts only there. A cancelled dialog, a cooldown, a mute or a client
// that never sends leaves the token unused and uncounted.
const crypto = require("crypto");
const redis = require("./redis");

const FLAG_THRESHOLD = 5;
const ABUSE_PROBABILITY = 0.8;
const TOKEN_TTL_SECONDS = 600;
const COUNTER_TTL_SECONDS = 12 * 60 * 60;

const NUDGE_TEXT =
  `Automated warning: ${FLAG_THRESHOLD} of your messages this game read as personal attacks. ` +
  "Nobody has been notified; if another player reports you, moderators will review them. " +
  "Please be respectful of other players.";

async function issueToken({ userId, gameId, category, prob, abusePrompt }) {
  if (!userId || !gameId) return null;

  const token = crypto.randomBytes(12).toString("hex");
  const payload = JSON.stringify({
    u: userId,
    g: gameId,
    c: category,
    p: prob,
    // True when the pre-send abuse prompt is enabled: those players already
    // saw the dialog, so they are not nudged afterwards.
    e: Boolean(abusePrompt),
  });

  await redis.client.setAsync(
    `rl:verdict:${token}`,
    payload,
    "EX",
    TOKEN_TTL_SECONDS
  );

  return token;
}

// Single use: the token is removed whether or not it counts, so a duplicated
// or replayed message cannot be counted twice.
async function takeToken(token) {
  if (!token || typeof token !== "string") return null;

  const key = `rl:verdict:${token}`;
  const raw = await redis.client.getAsync(key);
  if (!raw) return null;
  await redis.client.delAsync(key);

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function countFlag(gameId, userId) {
  const key = `rl:flags:${gameId}:${userId}`;
  const count = await redis.client.incrAsync(key);
  if (count === 1) await redis.client.expireAsync(key, COUNTER_TTL_SECONDS);
  return count;
}

// One nudge per player per game.
async function claimNudge(gameId, userId) {
  const key = `rl:nudged:${gameId}:${userId}`;
  const result = await redis.client.setAsync(
    key,
    "1",
    "NX",
    "EX",
    COUNTER_TTL_SECONDS
  );
  return result === "OK";
}

// Pure decision for one accepted message: consume the token, count it if it
// qualifies, and report whether this message should trigger the nudge.
async function noteVerdict({ gameId, userId, token }) {
  const verdict = await takeToken(token);
  if (!verdict || !userId) return { counted: false, nudge: false, reason: "no-token" };
  if (verdict.u !== userId || verdict.g !== gameId) {
    return { counted: false, nudge: false, reason: "mismatch" };
  }
  if (verdict.e) return { counted: false, nudge: false, reason: "prompt-on" };
  if (verdict.c !== "abuse" || !(verdict.p >= ABUSE_PROBABILITY)) {
    return { counted: false, nudge: false, reason: "not-abuse" };
  }

  const count = await countFlag(gameId, userId);
  if (count < FLAG_THRESHOLD) return { counted: true, count, nudge: false };
  if (!(await claimNudge(gameId, userId))) {
    return { counted: true, count, nudge: false, reason: "already" };
  }

  return { counted: true, count, nudge: true };
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
