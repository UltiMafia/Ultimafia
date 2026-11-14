const constants = require("../data/constants");

// Missing fields retain the established rules for existing seasons.
function competitiveSettings(season = {}) {
  return {
    openDays: season.openDays ?? constants.openDaysPerCompetitiveRound,
    reviewDays: season.reviewDays ?? constants.reviewDaysPerCompetitiveRound,
    dailyHearts: season.dailyHearts ?? constants.goldHeartsPerCompetitiveDay,
    fortuneLimit: season.fortuneLimit === null ? null :
      (season.fortuneLimit ?? constants.competitiveRoundFortuneHammer),
    graceHours: season.graceHours ?? constants.competitiveHeartGracePeriodMillis / 3600000,
  };
}

module.exports = competitiveSettings;
