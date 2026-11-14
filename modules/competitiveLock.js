const models = require("../db/models");
const { randomUUID } = require("crypto");

// No expiring lease: a stalled worker must never resume heart writes after a
// replacement worker acquires the same season. Persisted phase is diagnostic,
// never proof that it is safe to clear an abandoned ownership token.
async function withCompetitiveLock(seasonNumber, work, skipBusy = false, operation = "competitive mutation") {
  const token = randomUUID();
  const season = await models.CompetitiveSeason.findOneAndUpdate(
    { number: seasonNumber, operationToken: null },
    { $set: { operationToken: token, operationStartedAt: Date.now(), operationName: operation, operationPhase: "reading" } },
    { new: true }
  ).lean();
  if (!season) {
    if (skipBusy) return false;
    const error = new Error("Season is busy or unavailable. Refresh before retrying; a persistent busy state needs operator review.");
    error.status = 409;
    throw error;
  }
  let mutationAttempted = false;
  const release = async () => {
    const result = await models.CompetitiveSeason.updateOne(
      { number: seasonNumber, operationToken: token },
      { $unset: { operationToken: "", operationStartedAt: "", operationName: "", operationPhase: "" } }
    );
    if (result.matchedCount !== 1) throw new Error("Competitive operation ownership changed before release.");
  };
  const beginMutation = async () => {
    // Set BEFORE awaiting: acknowledgment loss for the marker is ambiguous too.
    mutationAttempted = true;
    const result = await models.CompetitiveSeason.updateOne(
      { number: seasonNumber, operationToken: token },
      { $set: { operationPhase: "mutating" } }
    );
    if (result.matchedCount !== 1) throw new Error("Competitive operation ownership lost before mutation.");
  };
  try {
    // Callers must await beginMutation before any business/cache/audit write;
    // they must not leave outstanding asynchronous work when this unwinds.
    const result = await work(beginMutation);
    await release();
    return result;
  } catch (error) {
    if (!mutationAttempted) {
      // Only this caught, fully unwound read stage is safe to release. A crash
      // or an external observer seeing phase=reading is NOT equivalent.
      try {
        await release();
      } catch (releaseError) {
        error.message += ` [Read-stage ownership release unconfirmed: ${releaseError.message}]`;
      }
    } else {
      error.message += ` [Interrupted ${operation}, season ${seasonNumber}, token ${token}; operator reconciliation required.]`;
    }
    throw error;
  }
}
module.exports = withCompetitiveLock;
