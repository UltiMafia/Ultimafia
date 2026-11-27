const models = require("../db/models");
const redis = require("./redis");
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;
const shortid = require("shortid");
const routeUtils = require("../routes/utils");
const constants = require("../data/constants");
const { getSeasonRules } = require("./competitiveRules");

// SEE: https://docs.google.com/document/d/1amLZWVBKyalKh7KalYpCDgZSmmNmBy1-BIASOj9GnFA
// v1: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], used in seasons 1 and 2
// v2: proposed to make it more possible to climb up after a round is determined
const POINTS_TABLE = [20, 18, 16, 14, 12, 10, 9, 8, 7, 6, 3, 3, 3, 3, 3]

async function getMaxRoundFortune(seasonNumber, roundNumber) {
  const result = await models.CompetitiveGameCompletion.aggregate([
    {
      $match: {
        season: seasonNumber,
        round: roundNumber,
        valid: true,
      },
    },
    {
      $group: {
        _id: "$userId",
        total: { $sum: "$points" },
      },
    },
    {
      $group: {
        _id: null,
        maxFortune: { $max: "$total" },
      },
    },
  ]);

  return result[0]?.maxFortune ?? 0;
}

async function hasReachedFinishLine(seasonNumber, roundNumber, finishLinePoints) {
  const maxFortune = await getMaxRoundFortune(seasonNumber, roundNumber);
  return maxFortune >= finishLinePoints;
}

// Stops new gold hearts and starts the grace period. When called at a day
// boundary, the grace period counts as a round day of its own.
async function endOpenPhase(
  roundId,
  seasonNumber,
  roundNumber,
  nowMillis = Date.now(),
  advanceDay = false
) {
  const update = {
    $set: {
      openPhaseEndedAt: nowMillis,
      remainingOpenDays: 0,
    },
  };
  if (advanceDay) {
    update.$inc = { currentDay: 1 };
  }
  await models.CompetitiveRound.updateOne(
    { _id: ObjectID(roundId) },
    update
  ).exec();
  await redis.invalidateCompRoundCache(seasonNumber, roundNumber);
}

async function endGracePeriod(roundId, seasonNumber, roundNumber, now = new Date()) {
  console.log(`[progressCompetitive]: Grace period ended, resetting gold hearts`);
  await models.User.updateMany({}, { $set: { goldHearts: 0 } }).exec();
  await redis.invalidateAllCachedUsers();
  await models.CompetitiveRound.updateOne(
    { _id: ObjectID(roundId) },
    {
      $set: {
        completed: true,
        dateCompleted: now.toISOString().split("T")[0],
      },
    }
  ).exec();
  await redis.invalidateCompRoundCache(seasonNumber, roundNumber);
}

/**
 * Records the moment a player first reaches the season's finish line.
 *
 * Reaching it does not stop play: the current day finishes as normal, and at
 * the next day boundary the open phase ends with no new hearts, so the day
 * after is the 24-hour grace day to finish hearts.
 *
 * @returns {Promise<boolean>} whether the round has reached its finish line
 */
async function checkFinishLine(season, round, nowMillis = Date.now()) {
  if (round.completed || round.openPhaseEndedAt || round.currentDay < 1) {
    return false;
  }
  if (round.finishLineReachedAt) {
    return true;
  }

  const { finishLinePoints } = getSeasonRules(season);
  if (!(await hasReachedFinishLine(season.number, round.number, finishLinePoints))) {
    return false;
  }

  console.log(
    `[progressCompetitive]: Finish line (${finishLinePoints}) reached in season ${season.number} round ${round.number} day ${round.currentDay}; hearts stop at the next day boundary`
  );
  await models.CompetitiveRound.updateOne(
    { _id: ObjectID(round._id), finishLineReachedAt: null },
    { $set: { finishLineReachedAt: nowMillis } }
  ).exec();
  await redis.invalidateCompRoundCache(season.number, round.number);
  return true;
}

async function progressCompetitive(now = new Date()) {
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

    let startDateNew = new Date(now);
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
      remainingOpenDays: constants.openDaysPerCompetitiveRound,
      remainingReviewDays: constants.reviewDaysPerCompetitiveRound,
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
    const nowMillis = now.getTime();

    if (currentRound.openPhaseEndedAt) {
      if (!currentSeason.paused) {
        const graceEndsAt =
          currentRound.openPhaseEndedAt +
          constants.competitiveHeartGracePeriodMillis;
        if (nowMillis >= graceEndsAt) {
          await endGracePeriod(
            currentRound._id,
            seasonNumber,
            currentRound.number,
            now
          );
        }
      }
      return;
    }

    let finishLineReached = Boolean(currentRound.finishLineReachedAt);
    if (!currentSeason.paused && !finishLineReached) {
      finishLineReached = await checkFinishLine(
        currentSeason,
        currentRound,
        nowMillis
      );
    }

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
      } else if (finishLineReached || currentRound.remainingOpenDays <= 0) {
        // The last open day (or the day someone reached the finish line) is
        // over. The next day is the grace day: no new hearts, 24 hours to
        // spend the ones players still have.
        console.log(
          `[progressCompetitive]: Open phase ended for season ${seasonNumber} round ${
            currentRound.number
          } (${
            finishLineReached ? "finish line reached" : "open days exhausted"
          }); starting grace day ${currentRound.currentDay + 1}`
        );
        await endOpenPhase(
          currentRound._id,
          seasonNumber,
          currentRound.number,
          nowMillis,
          true
        );
      } else {
        // The round is still open: progress the day by one and give everyone their gold hearts
        console.log(
          `[progressCompetitive]: Starting season ${seasonNumber} round ${
            currentRound.number
          } day ${currentRound.currentDay + 1}`
        );
        console.log(
          `[progressCompetitive]: Giving everyone ${constants.goldHeartsPerCompetitiveDay} gold hearts`
        );
        await models.User.updateMany(
          {},
          { $inc: { goldHearts: constants.goldHeartsPerCompetitiveDay } }
        ).exec();
        await redis.invalidateAllCachedUsers();

        await models.CompetitiveRound.updateOne(
          { _id: ObjectID(currentRound._id) },
          {
            $inc: {
              currentDay: 1,
              remainingOpenDays: -1,
            },
          }
        ).exec();
        await redis.invalidateCompRoundCache(seasonNumber, currentRound.number);
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
  const season = await models.CompetitiveSeason.findOne({
    number: seasonNumber,
  })
    .select("numRounds")
    .lean();

  const awardRoundCrownTrophy = season?.numRounds !== 1;

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
    // Players below the season's point minimum are unranked and earn no prestige.
    const qualified = roundStanding.qualified !== false && ranking !== null;
    const championshipPoints =
      qualified && ranking < POINTS_TABLE.length ? POINTS_TABLE[ranking] : 0;
    const existingSeasonStanding =
      await models.CompetitiveSeasonStanding.findOne({
        userId: roundStanding.userId,
        season: seasonNumber,
      });
    if (existingSeasonStanding) {
      console.log(
        `[confirmStandings]: Updating season ${seasonNumber} standing for ${userId}: achieved ranking ${ranking} and earned ${championshipPoints} prestige from round ${roundNumber}`
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
        `[confirmStandings]: Creating season ${seasonNumber} standing for ${userId}: achieved ranking ${ranking} and earned ${championshipPoints} prestige from round ${roundNumber}`
      );
      const seasonStanding = new models.CompetitiveSeasonStanding({
        userId: roundStanding.userId,
        season: seasonNumber,
        points: championshipPoints,
        tiebreakerPoints: points,
      });
      await seasonStanding.save();
    }

    try {
      await models.User.updateOne(
        { id: userId },
        {
          $inc: {
            championshipPoints: championshipPoints,
          },
        }
      ).exec();
    }
    catch (e) {
      console.error(`[confirmStandings]: Error updating championship points for ${userId}`, e);
    }

    // Round winners earn a crown trophy; single-round seasons skip this and
    // award gold/silver/bronze at endSeason instead.
    if (qualified && ranking === 0 && awardRoundCrownTrophy) {
      try {
        await awardRoundTrophy(seasonNumber, roundNumber, userId);
      }
      catch (e) {
        console.error(`[confirmStandings]: Error awarding round trophy to ${userId} for season ${seasonNumber} round ${roundNumber}`, e);
      }
    }

    i++;
  }
}

async function endSeason(seasonNumber) {
  console.log(`[endSeason]: Ending season ${seasonNumber}`);

  // Get the top 3 standings for the season
  // Sort by points (descending), then by tiebreakerPoints (descending)
  // Players who never placed in a round (0 prestige) can't take a season trophy.
  const topStandings = await models.CompetitiveSeasonStanding.find({
    season: seasonNumber,
    points: { $gt: 0 },
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

async function accountCompetitiveRounds(nowDate = new Date()) {
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
    const now = nowDate.getTime();
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
  checkFinishLine,
};