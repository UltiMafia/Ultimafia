const models = require("../db/models");
const redis = require("./redis");
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;

// SEE: https://docs.google.com/document/d/1amLZWVBKyalKh7KalYpCDgZSmmNmBy1-BIASOj9GnFA
const POINTS_TABLE = [
  25,
  18,
  15,
  12,
  10,
  8,
  6,
  4,
  2,
  1,
];

async function progressCompetitive() {
  // Get the current season, if any
  const currentSeason = await models.CompetitiveSeason.findOne({ completed: false })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no active season
  if (!currentSeason) {
    return;
  }

  const seasonNumber = currentSeason.number;
  console.log(`[progressCompetitive]: Checking season ${seasonNumber}`);

  // Get the current round, if any
  const currentRound = await models.CompetitiveRound.findOne({ season: seasonNumber, completed: false })
    .sort({ number: -1 })
    .lean();

  let startDateNew = null;
  if (!currentRound) {
    // If this season lacks any rounds, then create the very first one
    console.log(`[progressCompetitive]: Beginning season ${seasonNumber}`);
    startDateNew = new Date(currentSeason.startDate);
  }
  else {
    const now = Date.now();
    const startDate = new Date(currentRound.startDate);
    const endDate = new Date(currentRound.endDate);

    // Check to see if the round has ended
    if (now > endDate) {
      console.log(`[progressCompetitive]: Ending season ${seasonNumber} round ${currentRound.number}`);
      // If so, schedule a new round on the first day matching the current round's start day of the week that occurs after the end date
      const startDayOfWeek = startDate.getDay();
      const endDayOfWeek = endDate.getDay();

      // The plus seven is only for preventing modulo of a negative number
      let daysUntilNextRound = (startDayOfWeek > endDayOfWeek)
        ? (startDayOfWeek - endDayOfWeek) % 7
        : (startDayOfWeek + 7 - endDayOfWeek) % 7;

      // For the sanity of moderators, the gap between rounds must be at least 6 days. The comp players can wait.
      // This could occur if a round was paused and then resumed for a number of days not divisible by 7
      if (daysUntilNextRound < 6) {
        daysUntilNextRound += 7;
      }

      startDateNew = new Date(endDate);
      startDateNew.setDate(endDate.getDate() + daysUntilNextRound);

      const roundInfo = await redis.getCurrentCompRoundInfo(false);

      let i = 0;
      for (const roundStanding of roundInfo.standings) {
        const userId = roundStanding.userId;
        const ranking = roundStanding.ranking;
        const championshipPoints = (ranking < POINTS_TABLE.length) ? POINTS_TABLE[ranking] : 0;
        const existingSeasonStanding = await models.CompetitiveSeasonStanding.findOne({ userId: roundStanding.userId, season: seasonNumber });
        if (existingSeasonStanding) {
          console.log(`[progressCompetitive]: Updating season ${seasonNumber} standing for ${userId}: achieved ranking ${ranking} and earned ${championshipPoints} prestige from round ${currentRound.number}`);
          await models.CompetitiveSeasonStanding.updateOne(
            { _id: existingSeasonStanding._id },
            {
              $inc: { points: championshipPoints },
            },
          ).exec();
        }
        else {
          console.log(`[progressCompetitive]: Creating season ${seasonNumber} standing for ${userId}: achieved ranking ${ranking} and earned ${championshipPoints} prestige from round ${currentRound.number}`);
          const seasonStanding = new models.CompetitiveSeasonStanding({
            userId: roundStanding.userId,
            season: seasonNumber,
            points: championshipPoints,
          });
          await seasonStanding.save();
        }
        i++;
      }

      await models.CompetitiveRound.updateOne(
        { _id: ObjectID(currentRound._id) },
        { $set: { completed: true } }
      ).exec();

      if (currentRound.number >= currentSeason.numRounds) {
        console.log(`[progressCompetitive]: Ending season ${seasonNumber}`);
      }
    }
    else {
      let endOfRoundDay = new Date(startDate);

      // Check to see if the round's current day has ended
      endOfRoundDay.setDate(startDate.getDate() + currentRound.currentDay);
      if (now > endOfRoundDay) {
        // If so, progress the day by one and give everyone their gold hearts
        console.log(`[progressCompetitive]: Starting season ${seasonNumber} round ${currentRound.number} day ${currentRound.currentDay + 1}`);

        // Don't add gold hearts on the eighth day
        if (currentRound.currentDay + 1 < 8) {
          console.log(`[progressCompetitive]: Giving everyone 4 gold hearts`);
          await models.User.updateMany({}, { $inc: { goldHearts: 4 } }).exec();
          await redis.invalidateAllCachedUsers();
        }

        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          { $inc: { currentDay: 1 } }
        ).exec();
      }
      else {
        // Nothing to do, we are still on the same round's day
        return;
      }
    }
  }

  if (startDateNew !== null) {
    const roundNumber = currentRound ? currentRound.number + 1 : 1;
    let endDateNew = new Date(startDateNew);
    endDateNew.setDate(startDateNew.getDate() + 8);

    console.log(`[progressCompetitive]: Starting season ${seasonNumber} round ${roundNumber}`);
    const round = new models.CompetitiveRound({
      season: seasonNumber,
      number: roundNumber,
      currentDay: 0,
      startDate: startDateNew.toISOString().split('T')[0],
      endDate: endDateNew.toISOString().split('T')[0],
    });
    const newDocument = await round.save();

    // Append the round to the season for easy lookup
    await models.CompetitiveSeason.updateOne(
      { number: seasonNumber },
      {
        $set: { currentRound: roundNumber },
        $push: { rounds: newDocument._id }
      },
    );

    console.log(`[progressCompetitive]: Setting everyone's gold hearts to 0`);
    await models.User.updateMany({}, { $set: { goldHearts: 0 } }).exec();
    await redis.invalidateAllCachedUsers();
  }
}

module.exports = {
  POINTS_TABLE,
  progressCompetitive,
};
