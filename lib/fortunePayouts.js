/**
 * Fortune point payouts for setups. Uses the same formula as Game.adjustSkillRatings:
 * payout = pointsNominalAmount/2 / winPredictionPercent (capped at pointsNominalAmount * 20).
 */
const { rating, predictWin } = require("openskill");
const { bradleyTerryFull } = require("openskill/models");
const constants = require("../data/constants");

function getFortunePayouts(factionRatings) {
  if (!factionRatings || factionRatings.length === 0) return null;
  try {
    const ratings = factionRatings.map((fr) =>
      rating({
        mu: fr.skillRating?.mu ?? 25,
        sigma: fr.skillRating?.sigma ?? 25 / 3,
      })
    );
    const predictions = predictWin(ratings, { model: bradleyTerryFull });
    const maxPayout = constants.pointsNominalAmount * 20;
    const payouts = {};
    factionRatings.forEach((fr, i) => {
      const p = predictions[i];
      const payout = Math.min(
        maxPayout,
        Math.round(constants.pointsNominalAmount / 2 / (p || 1e-6))
      );
      payouts[fr.factionName] = payout;
    });
    return payouts;
  } catch (e) {
    return null;
  }
}

module.exports = { getFortunePayouts };
