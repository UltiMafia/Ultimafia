const models = require("../db/models");
const redis = require("./redis");
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;

// SEE: https://docs.google.com/document/d/1amLZWVBKyalKh7KalYpCDgZSmmNmBy1-BIASOj9GnFA

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

async function rollupCompetitiveGameCompletions() {
  const currentSeason = await models.CompetitiveSeason.findOne({ completed: false })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no active season
  if (!currentSeason) {
    return;
  }

  const seasonNumber = currentSeason.number;
  console.log(`[rollupCompetitiveGameCompletions]: Checking season ${seasonNumber}`);

  // Get the current round, if any
  const currentRound = await models.CompetitiveRound.findOne({ season: seasonNumber, completed: false })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no active round or completed days yet
  if (!currentRound || currentRound.currentDay < 2) {
    return;
  }

  // Nothing to do if everything has already been accounted for
  const dayToAccount = currentRound.currentDay - 1;
  if (currentRound.accountedDay >= dayToAccount) {
    return;
  }

  // Find all game completions for this round that have not been accounted yet
  console.log(`[rollupCompetitiveGameCompletions]: Updating season ${seasonNumber} round ${currentRound.number} day ${dayToAccount} standings`);
  const gameCompletions = await models.CompetitiveGameCompletion.find({
    $and: [
      { season: seasonNumber },
      { round: currentRound.number },
      { day: {$gt: currentRound.accountedDay} },
      { day: {$lte: dayToAccount} },
    ],
  }).lean();

  // Accumulate updates by user ID
  let userUpdates = {};
  for (const gameCompletion of gameCompletions) {
    const userId = gameCompletion.userId;
    if (userUpdates[userId] === undefined) {
      userUpdates[userId] = {
        points: 0,
        games: [],
      };
    }
    userUpdates[userId].points += gameCompletion.points;
    userUpdates[userId].games.push(gameCompletion.game);
  }

  // Update the round standing for each user accordingly
  for (const userId of Object.keys(userUpdates)) {
    const update = userUpdates[userId];

    const existingRoundStanding = await models.CompetitiveRoundStanding.findOne({ userId: userId, season: seasonNumber, round: currentRound.number });
    if (existingRoundStanding) {
      console.log(`[rollupCompetitiveGameCompletions]: Updating season ${seasonNumber} round ${currentRound.number} standing for ${userId}: +${update.points} points from day ${dayToAccount}`);
      await models.CompetitiveRoundStanding.updateOne(
        { _id: existingRoundStanding._id },
        {
          $inc: { points: update.points },
          $push: { games: update.games },
        },
      ).exec();
    }
    else {
      console.log(`[rollupCompetitiveGameCompletions]: Creating season ${seasonNumber} round ${currentRound.number} standing for ${userId}: +${update.points} points from day ${dayToAccount}`);
      const roundStanding = new models.CompetitiveRoundStanding({
        userId: userId,
        season: seasonNumber,
        round: currentRound.number,
        points: update.points,
        accountedGames: update.games,
        invalidatedGames: [],
      });
      await roundStanding.save();
    }
  }

  // Now that the day has been accounted for, set the round's accounted day
  await models.CompetitiveRound.updateOne(
    { season: seasonNumber, number: currentRound.number },
    {
      $set: { accountedDay: dayToAccount },
    },
  );
}

async function rollupCompetitiveRoundStandings() {
  const currentSeason = await models.CompetitiveSeason.findOne({ completed: false })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no active season
  if (!currentSeason) {
    return;
  }

  const seasonNumber = currentSeason.number;
  console.log(`[rollupCompetitiveRoundStandings]: Checking season ${seasonNumber}`);

  // Nothing to do if everything has already been accounted for
  const roundToAccount = currentSeason.currentRound - 1;
  if (currentSeason.accountedRound >= roundToAccount) {
    return;
  }

  // Find all rounds for this season that have not been accounted yet
  console.log(`[rollupCompetitiveRoundStandings]: Updating season ${seasonNumber} round ${roundToAccount} standings`);
  const roundStandings = await models.CompetitiveRoundStanding.find({
    $and: [
      { season: seasonNumber },
      { round: {$gt: currentSeason.accountedRound} },
      { round: {$lte: roundToAccount} },
    ],
  })
    .sort({ points: -1 })
    .lean();

  // CHAMPIONSHIP POINTS: grant points to the top 10 scorers according to a table
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

  // Update the round standing for each top 10 user accordingly
  let i = 0;
  for (const roundStanding of roundStandings) {
    const championshipPoints = i < POINTS_TABLE.length ? POINTS_TABLE[i] : 0;
    const existingSeasonStanding = await models.CompetitiveSeasonStanding.findOne({ userId: roundStanding.userId, season: seasonNumber });
    if (existingSeasonStanding) {
      console.log(`[rollupCompetitiveRoundStandings]: Updating season ${seasonNumber} standing for ${roundStanding.userId}: +${championshipPoints} points from round ${roundStanding.round}`);
      await models.CompetitiveSeasonStanding.updateOne(
        { _id: existingSeasonStanding._id },
        {
          $inc: { points: championshipPoints },
        },
      ).exec();
    }
    else {
      console.log(`[rollupCompetitiveRoundStandings]: Creating season ${seasonNumber} standing for ${roundStanding.userId}: +${championshipPoints} points from round ${roundStanding.round}`);
      const seasonStanding = new models.CompetitiveSeasonStanding({
        userId: roundStanding.userId,
        season: seasonNumber,
        points: championshipPoints,
      });
      await seasonStanding.save();
    }
    i++;
  }

  // Now that the day has been accounted for, set the round's accounted day
  await models.CompetitiveSeason.updateOne(
    { number: seasonNumber },
    {
      $set: { accountedRound: roundToAccount },
    },
  ).exec();
}

module.exports = {
  progressCompetitive,
  rollupCompetitiveGameCompletions,
  rollupCompetitiveRoundStandings,
};

