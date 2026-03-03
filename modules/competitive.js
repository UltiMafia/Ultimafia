const models = require("../db/models");
const redis = require("./redis");
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;
const shortid = require("shortid");
const routeUtils = require("../routes/utils");

// SEE: https://docs.google.com/document/d/1amLZWVBKyalKh7KalYpCDgZSmmNmBy1-BIASOj9GnFA
const POINTS_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

async function progressCompetitive() {
  // Get the current season, if any
  const currentSeason = await models.CompetitiveSeason.findOne({
    completed: false,
  })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no active season
  if (!currentSeason) {
    return;
  }

  const seasonNumber = currentSeason.number;
  console.log(`[progressCompetitive]: Checking season ${seasonNumber}`);

  // Get the current round, if any
  const currentRound = await models.CompetitiveRound.findOne({
    season: seasonNumber,
    number: currentSeason.currentRound,
  })
    .sort({ number: -1 })
    .lean();

  if (!currentRound) {
    // If this season lacks a round record for the current round, then schedule and create it
    console.log(
      `[progressCompetitive]: Starting season ${seasonNumber} round ${currentSeason.currentRound}`
    );

    const now = new Date();
    let startDateNew = new Date();
    if (currentSeason.currentRound !== 1) {
      const startDayOfWeek = new Date(currentSeason.startDate).getUTCDay();
      const endDayOfWeek = now.getUTCDay();

      // The plus seven is only for preventing modulo of a negative number
      const daysUntilNextRound =
        startDayOfWeek > endDayOfWeek
          ? (startDayOfWeek - endDayOfWeek) % 7
          : (startDayOfWeek + 7 - endDayOfWeek) % 7;
      startDateNew = new Date(now);
      startDateNew.setUTCDate(now.getUTCDate() + daysUntilNextRound);
    } else {
      // For the very first round, set the start date to the start date of the season
      const seasonStartDate = new Date(currentSeason.startDate);
      startDateNew = new Date(seasonStartDate);
      startDateNew.setUTCDate(seasonStartDate.getUTCDate());
    }

    const round = new models.CompetitiveRound({
      season: seasonNumber,
      number: currentSeason.currentRound,
      startDate: startDateNew.toISOString().split("T")[0],
    });
    const newDocument = await round.save();

    // Append the round to the season for easy lookup
    await models.CompetitiveSeason.updateOne(
      { number: seasonNumber },
      {
        $set: { currentRound: currentSeason.currentRound },
        $push: { rounds: newDocument._id },
      }
    );

    console.log(`[progressCompetitive]: Setting everyone's gold hearts to 0`);
    await models.User.updateMany({}, { $set: { goldHearts: 0 } }).exec();
    await redis.invalidateAllCachedUsers();
  } else if (!currentRound.completed) {
    const now = new Date();
    const startDate = new Date(currentRound.startDate);
    let endOfRoundDay = new Date(startDate);

    // Check to see if the round's current day has ended
    endOfRoundDay.setUTCDate(startDate.getUTCDate() + currentRound.currentDay);
    if (now > endOfRoundDay) {
      if (currentSeason.paused) {
        // Progress the day only if the round is paused
        console.log(
          `[progressCompetitive]: Starting season ${seasonNumber} round ${
            currentRound.number
          } day ${currentRound.currentDay + 1} (paused)`
        );
        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          {
            $inc: {
              currentDay: 1,
            },
          }
        ).exec();
      } else if (currentRound.remainingOpenDays > 0) {
        // Check to see if the round is still open. If so, progress the day by one and give everyone their gold hearts
        console.log(
          `[progressCompetitive]: Starting season ${seasonNumber} round ${
            currentRound.number
          } day ${currentRound.currentDay + 1}`
        );

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
            },
          }
        ).exec();
      } else {
        // We are on the last open day, the day has ended, so complete the round
        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          {
            $set: {
              completed: true,
              dateCompleted: now.toISOString().split("T")[0],
            },
          }
        ).exec();
      }
    } else {
      // Nothing to do, we are still on the same round's day
      return;
    }
  }
}

async function awardRoundTrophy(seasonNumber, roundNumber, userId) {
  const trophyName = `Season ${seasonNumber} Round ${roundNumber} Winner`;
  const trophyType = "crown";

  // Verify user exists
  const user = await models.User.findOne({
    id: userId,
    deleted: false,
  }).select("_id id name");

  if (!user) {
    console.log(`[awardRoundTrophy]: User ${userId} not found, skipping trophy award`);
    return;
  }

  // Check if user already has this trophy (to avoid duplicates)
  const existingTrophy = await models.Trophy.findOne({
    ownerId: userId,
    name: trophyName,
    revoked: false,
  });

  if (existingTrophy) {
    console.log(`[awardRoundTrophy]: User ${userId} already has trophy "${trophyName}", skipping`);
    return;
  }

  // Create and save the trophy
  const trophy = new models.Trophy({
    id: shortid.generate(),
    name: trophyName,
    ownerId: userId,
    owner: user._id,
    type: trophyType,
    createdBy: "system", // System-awarded trophy
  });
  await trophy.save();

  console.log(
    `[awardRoundTrophy]: Awarded ${trophyType} trophy "${trophyName}" to ${user.name} (${userId})`
  );

  // Send notification to the winner
  await routeUtils.createNotification(
    {
      content: `Congratulations! You won 1st place in Season ${seasonNumber} Round ${roundNumber} and earned a ${trophyType} trophy!`,
      icon: "fas fa-trophy",
      link: `/user/${userId}`,
    },
    [userId]
  );
}

async function confirmStandings(seasonNumber, roundNumber) {
  const roundInfo = await redis.getCompRoundInfo(
    seasonNumber,
    roundNumber,
    false
  );

  let i = 0;
  for (const roundStanding of roundInfo.standings) {
    const userId = roundStanding.userId;
    const ranking = roundStanding.ranking;
    const points = roundStanding.points;
    const championshipPoints =
      ranking < POINTS_TABLE.length ? POINTS_TABLE[ranking] : 0;
    const existingSeasonStanding =
      await models.CompetitiveSeasonStanding.findOne({
        userId: roundStanding.userId,
        season: seasonNumber,
      });
    if (existingSeasonStanding) {
      console.log(
        `[accountCompetitiveRounds]: Updating season ${seasonNumber} standing for ${userId}: achieved ranking ${ranking} and earned ${championshipPoints} prestige from round ${roundNumber}`
      );
      await models.CompetitiveSeasonStanding.updateOne(
        { _id: existingSeasonStanding._id },
        {
          $inc: {
            points: championshipPoints,
            tiebreakerPoints: points,
          },
        }
      ).exec();
    } else {
      console.log(
        `[accountCompetitiveRounds]: Creating season ${seasonNumber} standing for ${userId}: achieved ranking ${ranking} and earned ${championshipPoints} prestige from round ${roundNumber}`
      );
      const seasonStanding = new models.CompetitiveSeasonStanding({
        userId: roundStanding.userId,
        season: seasonNumber,
        points: championshipPoints,
        tiebreakerPoints: points,
      });
      await seasonStanding.save();
    }

    // if the user got first place, then award them a round trophy
    if (roundStanding.ranking === 0) {
      try {
        await awardRoundTrophy(seasonNumber, roundNumber, userId);
      }
      catch (e) {
        console.error(`[accountCompetitiveRounds]: Error awarding round trophy to ${userId} for season ${seasonNumber} round ${roundNumber}`, e);
      }
    }

    i++;
  }
}

async function endSeason(seasonNumber) {
  console.log(`[endSeason]: Ending season ${seasonNumber}`);

  // Get the top 3 standings for the season
  // Sort by points (descending), then by tiebreakerPoints (descending)
  const topStandings = await models.CompetitiveSeasonStanding.find({
    season: seasonNumber,
  })
    .sort({ points: -1, tiebreakerPoints: -1 })
    .limit(3)
    .lean();

  if (topStandings.length === 0) {
    console.log(`[endSeason]: No standings found for season ${seasonNumber}`);
    // Still mark the season as completed
    await models.CompetitiveSeason.updateOne(
      { number: seasonNumber },
      {
        $set: {
          completed: true,
        },
      }
    ).exec();
    return;
  }

  // Award trophies to top 3
  const trophyTypes = ["gold", "silver", "bronze"];
  const trophyNames = [
    `Season ${seasonNumber} Champion`,
    `Season ${seasonNumber} Runner-Up`,
    `Season ${seasonNumber} Third Place`,
  ];

  const winners = [];

  for (let i = 0; i < Math.min(topStandings.length, 3); i++) {
    const standing = topStandings[i];
    const userId = standing.userId;
    const trophyType = trophyTypes[i];
    const trophyName = trophyNames[i];

    // Verify user exists
    const user = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("_id id name");

    if (!user) {
      console.log(
        `[endSeason]: User ${userId} not found, skipping trophy award`
      );
      continue;
    }

    // Check if user already has this trophy (to avoid duplicates)
    const existingTrophy = await models.Trophy.findOne({
      ownerId: userId,
      name: trophyName,
      revoked: false,
    });

    if (existingTrophy) {
      console.log(
        `[endSeason]: User ${userId} already has trophy "${trophyName}", skipping`
      );
      winners.push({
        userId: userId,
        name: user.name,
        position: i + 1,
        points: standing.points,
        tiebreakerPoints: standing.tiebreakerPoints,
      });
      continue;
    }

    // Create and save the trophy
    const trophy = new models.Trophy({
      id: shortid.generate(),
      name: trophyName,
      ownerId: userId,
      owner: user._id,
      type: trophyType,
      createdBy: "system", // System-awarded trophy
    });
    await trophy.save();

    console.log(
      `[endSeason]: Awarded ${trophyType} trophy "${trophyName}" to ${user.name} (${userId})`
    );

    // Send notification to the winner
    await routeUtils.createNotification(
      {
        content: `Congratulations! You won ${
          i === 0 ? "1st" : i === 1 ? "2nd" : "3rd"
        } place in Season ${seasonNumber} and earned a ${trophyType} trophy!`,
        icon: "fas fa-trophy",
        link: `/user/${userId}`,
      },
      [userId]
    );

    winners.push({
      userId: userId,
      name: user.name,
      position: i + 1,
      points: standing.points,
      tiebreakerPoints: standing.tiebreakerPoints,
      trophyType: trophyType,
    });
  }

  // Mark the season as completed
  await models.CompetitiveSeason.updateOne(
    { number: seasonNumber },
    {
      $set: {
        completed: true,
      },
    }
  ).exec();

  console.log(
    `[endSeason]: Season ${seasonNumber} completed. Winners: ${winners
      .map(
        (w) =>
          `${w.name} (${w.position}${
            w.position === 1 ? "st" : w.position === 2 ? "nd" : "rd"
          })`
      )
      .join(", ")}`
  );

  console.log(`[endSeason]: Setting everyone's gold hearts to 0`);
  await models.User.updateMany({}, { $set: { goldHearts: 0 } }).exec();
  await redis.invalidateAllCachedUsers();
}

async function accountCompetitiveRounds() {
  // Get the current season, if any
  const currentSeason = await models.CompetitiveSeason.findOne({
    completed: false,
  })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no active season
  if (!currentSeason) {
    return;
  }

  const seasonNumber = currentSeason.number;
  console.log(`[accountCompetitiveRounds]: Checking season ${seasonNumber}`);

  // Get the current round, if any. Note the "accounted: false" filter
  const currentRound = await models.CompetitiveRound.findOne({
    season: seasonNumber,
    completed: true,
    accounted: false,
  })
    .sort({ number: -1 })
    .lean();

  // Nothing to do if there's no rounds in review
  if (!currentRound) {
    return;
  }

  if (!currentSeason.paused) {
    const now = Date.now();
    const startDate = new Date(currentRound.startDate);
    let endOfRoundDay = new Date(startDate);

    // Check to see if the round's current day has ended
    endOfRoundDay.setUTCDate(startDate.getUTCDate() + currentRound.currentDay);
    if (now > endOfRoundDay) {
      // Check to see if the round is still in review
      if (currentRound.remainingReviewDays > 0) {
        // If so, progress the day by one
        console.log(
          `[progressCompetitive]: Starting season ${seasonNumber} round ${
            currentRound.number
          } day ${currentRound.currentDay + 1}`
        );

        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          {
            $inc: {
              currentDay: 1,
              remainingReviewDays: -1,
            },
          }
        ).exec();
      } else {
        console.log(
          `[progressCompetitive]: Ending season ${seasonNumber} round ${currentRound.number}`
        );

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
        } else {
          // All rounds are complete, end the season
          await endSeason(seasonNumber);
        }
      }
    } else {
      // Nothing to do, we are still on the same round's day
      return;
    }
  }
}

module.exports = {
  POINTS_TABLE,
  progressCompetitive,
  accountCompetitiveRounds,
  endSeason,
};
