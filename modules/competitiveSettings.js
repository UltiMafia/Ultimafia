const models = require("../db/models");
const constants = require("../data/constants");

// Missing fields keep the established rules for existing seasons.
function competitiveSettings(season = {}) {
  return {
    openDays: season.openDays ?? constants.openDaysPerCompetitiveRound,
    reviewDays: season.reviewDays ?? constants.reviewDaysPerCompetitiveRound,
    dailyHearts: season.dailyHearts ?? constants.goldHeartsPerCompetitiveDay,
    // null turns off the finish line; open days still end the round.
    finishLinePoints:
      season.finishLinePoints === null
        ? null
        : season.finishLinePoints ?? constants.competitiveRoundFortuneHammer,
    // Off: the open phase ends as soon as the finish line is reached.
    // On: that day plays out and the open phase ends at the next day boundary.
    finishAtNextDay: season.finishAtNextDay ?? false,
    graceHours:
      season.graceHours ?? constants.competitiveHeartGracePeriodMillis / 3600000,
    // null keeps the weekly start day; otherwise the next round starts this
    // many days after the previous one ends.
    breakDays: season.breakDays ?? null,
    // Minimum days from one round's start to the next (e.g. 30 for monthly).
    roundIntervalDays: season.roundIntervalDays ?? null,
    // Site points a player needs to join competitive games. 0 is no minimum.
    entryMinimumPoints: season.entryMinimumPoints ?? 0,
  };
}

// Separate from the ranking minimum: this decides who may join at all.
async function competitiveEntryError(userInfo) {
  const season = await models.CompetitiveSeason.findOne({ completed: false })
    .sort({ number: -1 })
    .select("entryMinimumPoints")
    .lean();
  const { entryMinimumPoints } = competitiveSettings(season || {});
  if (entryMinimumPoints > 0 && !(Number(userInfo?.points) >= entryMinimumPoints)) {
    return `You need at least ${entryMinimumPoints} points to play competitive games.`;
  }
  return null;
}

module.exports = competitiveSettings;
module.exports.competitiveEntryError = competitiveEntryError;
