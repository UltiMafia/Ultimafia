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
  const currentRound = await models.CompetitiveRound.findOne({ season: seasonNumber, number: currentSeason.currentRound })
    .sort({ number: -1 })
    .lean();

  if (!currentRound) {
    // If this season lacks a round record for the current round, then schedule and create it
    console.log(`[progressCompetitive]: Starting season ${seasonNumber} round ${currentSeason.currentRound}`);

    const now = new Date(Date.now());
    const startDayOfWeek = new Date(currentSeason.startDate).getDay();
    const endDayOfWeek = now.getDay();

    // The plus seven is only for preventing modulo of a negative number
    let daysUntilNextRound = (startDayOfWeek > endDayOfWeek)
      ? (startDayOfWeek - endDayOfWeek) % 7
      : (startDayOfWeek + 7 - endDayOfWeek) % 7;

    let startDateNew = new Date(now);
    startDateNew.setDate(now.getDate() + daysUntilNextRound);

    const round = new models.CompetitiveRound({
      season: seasonNumber,
      number: currentSeason.currentRound,
      startDate: startDateNew.toISOString().split('T')[0],
    });
    const newDocument = await round.save();

    // Append the round to the season for easy lookup
    await models.CompetitiveSeason.updateOne(
      { number: seasonNumber },
      {
        $set: { currentRound: currentSeason.currentRound },
        $push: { rounds: newDocument._id }
      },
    );

    console.log(`[progressCompetitive]: Setting everyone's gold hearts to 0`);
    await models.User.updateMany({}, { $set: { goldHearts: 0 } }).exec();
    await redis.invalidateAllCachedUsers();
  }
  else if (!currentRound.completed && !currentRound.paused) {
    const now = new Date(Date.now());
    const startDate = new Date(currentRound.startDate);
    let endOfRoundDay = new Date(startDate);

    // Check to see if the round's current day has ended
    endOfRoundDay.setDate(startDate.getDate() + currentRound.currentDay);
    if (now > endOfRoundDay) {
      // Check to see if the round is still open
      if (currentRound.remainingOpenDays > 0) {
        // If so, progress the day by one and give everyone their gold hearts
        console.log(`[progressCompetitive]: Starting season ${seasonNumber} round ${currentRound.number} day ${currentRound.currentDay + 1}`);

        // Don't add gold hearts on the final day
        if (currentRound.remainingOpenDays > 1) {
          console.log(`[progressCompetitive]: Giving everyone 4 gold hearts`);
          await models.User.updateMany({}, { $inc: { goldHearts: 4 } }).exec();
          await redis.invalidateAllCachedUsers();
        }

        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          {
            $inc: {
              currentDay: 1,
              remainingOpenDays: -1,
            } 
          }
        ).exec();
      }
      else {
        // We are on the last open day, the day has ended, so complete the round
        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          {
            $set: {
              completed: true,
              dateCompleted: now.toISOString().split('T')[0],
            } 
          }
        ).exec();
      }
    }
    else {
      // Nothing to do, we are still on the same round's day
      return;
    }
  }
}

async function confirmStandings(seasonNumber, roundNumber) {
  const roundInfo = await redis.getCompRoundInfo(seasonNumber, roundNumber, false);

  let i = 0;
  for (const roundStanding of roundInfo.standings) {
    const userId = roundStanding.userId;
    const ranking = roundStanding.ranking;
    const points = roundStanding.points;
    const championshipPoints = (ranking < POINTS_TABLE.length) ? POINTS_TABLE[ranking] : 0;
    const existingSeasonStanding = await models.CompetitiveSeasonStanding.findOne({ userId: roundStanding.userId, season: seasonNumber });
    if (existingSeasonStanding) {
      console.log(`[accountCompetitiveRounds]: Updating season ${seasonNumber} standing for ${userId}: achieved ranking ${ranking} and earned ${championshipPoints} prestige from round ${roundNumber}`);
      await models.CompetitiveSeasonStanding.updateOne(
        { _id: existingSeasonStanding._id },
        {
          $inc: {
            points: championshipPoints,
            tiebreakerPoints: points,
          },
        },
      ).exec();
    }
    else {
      console.log(`[accountCompetitiveRounds]: Creating season ${seasonNumber} standing for ${userId}: achieved ranking ${ranking} and earned ${championshipPoints} prestige from round ${roundNumber}`);
      const seasonStanding = new models.CompetitiveSeasonStanding({
        userId: roundStanding.userId,
        season: seasonNumber,
        points: championshipPoints,
        tiebreakerPoints: points,
      });
      await seasonStanding.save();
    }
    i++;
  }
}

async function accountCompetitiveRounds() {
  // Get the current season, if any
  const currentSeason = await models.CompetitiveSeason.findOne({ completed: false })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no active season
  if (!currentSeason) {
    return;
  }

  const seasonNumber = currentSeason.number;
  console.log(`[accountCompetitiveRounds]: Checking season ${seasonNumber}`);

  // Get the current round, if any. Note the "accounted: false" filter
  const currentRound = await models.CompetitiveRound.findOne({ season: seasonNumber, completed: true, accounted: false })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no rounds in review
  if (!currentRound) {
    return;
  }

  if (!currentRound.paused) {
    const now = Date.now();
    const startDate = new Date(currentRound.startDate);
    let endOfRoundDay = new Date(startDate);

    // Check to see if the round's current day has ended
    endOfRoundDay.setDate(startDate.getDate() + currentRound.currentDay);
    if (now > endOfRoundDay) {
      // Check to see if the round is still in review
      if (currentRound.remainingReviewDays > 0) {
        // If so, progress the day by one
        console.log(`[progressCompetitive]: Starting season ${seasonNumber} round ${currentRound.number} day ${currentRound.currentDay + 1}`);

        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          {
            $inc: {
              currentDay: 1,
              remainingReviewDays: -1,
            } 
          }
        ).exec();
      }
      else {
        console.log(`[progressCompetitive]: Ending season ${seasonNumber} round ${currentRound.number}`);

        await confirmStandings(seasonNumber, currentRound.number);

        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          { $set: { accounted: true } }
        ).exec();

        const roundNumberNew = currentRound.number + 1;
        if (roundNumberNew <= currentSeason.numRounds) {
          // Now that this round is fully done, increment the season's round counter
          await models.CompetitiveSeason.updateOne(
            { number: seasonNumber },
            { $inc: { currentRound: 1 } }
          ).exec();
        }
        else {
          // TODO end season
        }
      }
    }
    else {
      // Nothing to do, we are still on the same round's day
      return;
    }
  }
}

module.exports = {
  POINTS_TABLE,
  progressCompetitive,
  accountCompetitiveRounds,
};
