// Nudge policy, free of Redis so it can be unit tested. `noteVerdict` takes a
// store with takeToken/countFlag/claimNudge; modules/ruleNudge.js supplies the
// Redis-backed one.
const FLAG_THRESHOLD = 5;
const ABUSE_PROBABILITY = 0.8;

const NUDGE_TEXT =
  `Automated warning: ${FLAG_THRESHOLD} of your messages this game read as personal attacks. ` +
  "If a player reports you, moderators will review them. " +
  "Please be respectful of other players.";

// Decide one accepted message: consume its token, count it when it qualifies,
// and report whether this message should raise the nudge.
async function noteVerdict({ gameId, userId, token }, store) {
  const verdict = await store.takeToken(token);
  if (!verdict || !userId) {
    return { counted: false, nudge: false, reason: "no-token" };
  }
  if (verdict.u !== userId || verdict.g !== gameId) {
    return { counted: false, nudge: false, reason: "mismatch" };
  }
  // The pre-send abuse prompt was on: the player already saw the dialog.
  if (verdict.e) {
    return { counted: false, nudge: false, reason: "prompt-on" };
  }
  // `verdict.a` is the abuse-class probability; `verdict.p` is the chance of
  // any violation, which an OGI-heavy message can clear on its own.
  if (verdict.c !== "abuse" || !(verdict.a >= ABUSE_PROBABILITY)) {
    return { counted: false, nudge: false, reason: "not-abuse" };
  }

  const count = await store.countFlag(gameId, userId);
  if (count < FLAG_THRESHOLD) return { counted: true, count, nudge: false };
  if (!(await store.claimNudge(gameId, userId))) {
    return { counted: true, count, nudge: false, reason: "already" };
  }

  return { counted: true, count, nudge: true };
}

module.exports = {
  FLAG_THRESHOLD,
  ABUSE_PROBABILITY,
  NUDGE_TEXT,
  noteVerdict,
};
