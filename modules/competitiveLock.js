const models = require("../db/models");
const { randomUUID } = require("crypto");

// No expiring lease: a stalled worker must never resume heart writes after a
// replacement worker acquires the same season. An abandoned token requires
// operator reconciliation, not automatic unlocking/replay of side effects.
async function withCompetitiveLock(seasonNumber, work, skipBusy = false, operation = "competitive mutation") {
  const token = randomUUID();
  const season = await models.CompetitiveSeason.findOneAndUpdate(
    { number: seasonNumber, operationToken: null },
    { $set: { operationToken: token, operationStartedAt: Date.now(), operationName: operation } },
    { new: true }
  ).lean();
  if (!season) {
    if (skipBusy) return false;
    const error = new Error("Season is busy or unavailable. Refresh before retrying; a persistent busy state needs operator review.");
    error.status = 409;
    throw error;
  }
  try {
    const result = await work();
    await models.CompetitiveSeason.updateOne(
      { number: seasonNumber, operationToken: token },
      { $unset: { operationToken: "", operationStartedAt: "", operationName: "" } }
    );
    return result;
  } catch (error) {
    // Retain ownership after an ambiguous partial failure. Never replay heart
    // or accounting mutations automatically. The token identifies this attempt.
    error.message += ` [Interrupted ${operation}, season ${seasonNumber}, token ${token}; operator reconciliation required.]`;
    throw error;
  }
}
module.exports = withCompetitiveLock;
