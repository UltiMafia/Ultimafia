const axios = require("axios");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const Random = require("../lib/Random");
const constants = require("../data/constants");
const DailyChallengeData = require("../data/DailyChallenge");
const roleData = require("../data/roles");
const models = require("../db/models");
const redis = require("./redis");
const competitive = require("./competitive");
const logger = require("./logging")(".");
const routeUtils = require("../routes/utils");

module.exports = function () {
  const jobs = {
    recordLastActive: {
      run: async function () {
        try {
          var lastActive = await redis.getAllLastActive();

          for (let userId in lastActive) {
            await models.User.updateOne(
              { id: userId },
              { $set: { lastActive: lastActive[userId] } }
            ).exec();

            await models.Friend.updateMany(
              { friendId: userId },
              { $set: { lastActive: lastActive[userId] } }
            ).exec();
          }

          await redis.removeStaleUsers();
        } catch (e) {
          logger.error(e);
        }
      },
      interval: 1000 * 60 * 5,
    },
    expireBans: {
      run: async function () {
        try {
          var now = Date.now();
          var bans = await models.Ban.find({
            expires: { $lt: now },
            auto: false,
          }).select("userId auto type");
          var unbanUserIds = bans.map((b) => b.userId);

          if (unbanUserIds.length == 0) return;

          for (let ban of bans)
            if (ban.type == "site")
              await models.User.updateOne(
                { id: ban.userId },
                { banned: false }
              ).exec();

          await models.Ban.deleteMany({
            expires: { $lt: now },
            auto: false,
          }).exec();
          await routeUtils.createNotification(
            {
              content: "Your ban has expired.",
              icon: "ban",
            },
            unbanUserIds
          );

          for (let userId of unbanUserIds)
            await redis.cacheUserPermissions(userId);
        } catch (e) {
          logger.error(e);
        }
      },
      interval: 1000 * 60 * 5,
    },
    expireGames: {
      run: async function () {
        try {
          let oldGames = await models.Game.find({
            endTime: { $lt: Date.now() - 1000 * 60 * 60 * 24 * 30 },
          }).select("_id id players");

          for (let game of oldGames) {
            var archivedGame = await models.ArchivedGame.findOne({
              game: game._id,
            }).select("user game");
            if (archivedGame) {
              // Don't expire games that have been archived by someone
              continue;
            }

            for (let player of game.players)
              models.User.updateOne(
                { id: player },
                { $pull: { games: game._id } }
              ).exec();

            models.Game.deleteOne({ _id: game._id }).exec();
          }
        } catch (e) {
          logger.error(e);
        }
      },
      interval: 1000 * 60 * 10,
    },
    refreshHearts: {
      run: async function () {
        const now = Date.now();

        // Query all heart refreshes that have elapsed
        let refreshedHearts = await models.HeartRefresh.find({
          when: { $lt: now },
        }).select("userId type");
        for (let refreshedHeart of refreshedHearts) {
          const userId = refreshedHeart.userId;
          const type = refreshedHeart.type;

          var itemsOwned = await redis.getUserItemsOwned(userId);
          const bonusRedHearts = itemsOwned ? itemsOwned.bonusRedHearts : 0;

          const update = {};
          if (type === "red")
            update["redHearts"] =
              constants.initialRedHeartCapacity + bonusRedHearts;

          // Refresh the user's heart type to capacity
          const result1 = await models.User.updateOne(
            { id: userId },
            { $set: update }
          ).exec();
          if (result1.modifiedCount === 0) {
            console.warn(
              `Failed to refresh hearts for userId[${userId}] type[${type}]`
            );
          }

          // Remove the heart refresh so that it won't trigger again
          const result2 = await models.HeartRefresh.deleteOne({
            userId: userId,
            type: type,
          }).exec();
          if (result2.deletedCount === 0) {
            console.warn(
              `Failed to delete heart refresh for userId[${userId}] type[${type}]`
            );
          }

          await redis.cacheUserInfo(userId, true);
        }
      },
      interval: 1000 * 60,
    },
    heartMaintenance: {
      // This safeguard runs sparsely just in case a heart refresh never gets created for a user
      // This shouldn't be necessary but just in case it would suck if someone got to 0 and couldn't refresh their hearts
      run: async function () {
        var users = await models.User.find({
          $or: [
            { redHearts: { $exists: false } },
            { redHearts: { $lt: constants.initialRedHeartCapacity } },
          ],
        }).select("id");
        users = users.map((user) => user.toJSON());
        for (let user of users) {
          let heartRefresh = await models.HeartRefresh.findOne({
            userId: user.id,
            type: "red",
          });
          if (!heartRefresh) {
            console.warn(
              `Detected missing heart refresh: userId[${user.id}] type[red}]`
            );
            await models.User.updateOne(
              { id: user.id },
              { $set: { redHearts: constants.initialRedHeartCapacity } }
            ).exec();
            await redis.cacheUserInfo(user.id, true);
          }
        }
      },
      interval: 1000 * 7200,
    },
    refreshDailyChallenges: {
      run: async function () {
        const now = Date.now();

        // Query all heart refreshes that have elapsed
        let refreshedHearts = await models.DailyChallengeRefresh.find({
          when: { $lt: now },
        });
        for (let refreshedHeart of refreshedHearts) {
          //let  Object.entries(DailyChallengeData);

          let tierOne = Random.randArrayVal(
            Object.entries(DailyChallengeData)
              .filter((c) => c[1].tier == 1)
              .map((c) => [c[1].ID, 0, c[1].extraData || null])
          );
          let tierTwo = Random.randArrayVal(
            Object.entries(DailyChallengeData)
              .filter((c) => c[1].tier == 2)
              .map((c) => [c[1].ID, 0, c[1].extraData || null])
          );
          let tierThree = Random.randArrayVal(
            Object.entries(DailyChallengeData)
              .filter((c) => c[1].tier == 3)
              .map((c) => [c[1].ID, 0, c[1].extraData || null])
          );
          //let tierFour = Random.randArrayVal(Object.entries(DailyChallengeData).filter((c) => c[1].tier == 4));
          //Format is [ID, progress, extraData]
          let Challenges = [tierOne, tierTwo, tierThree];
          for (let c of Challenges) {
            if (c[2] != null) {
              if (c[2] == "Game Type") {
                c[2] = Random.randArrayVal(constants.gameTypes);
              } else if (c[2] == "Role Name") {
                c[2] = Random.randArrayVal(
                  Object.entries(roleData.Mafia)
                    .filter(
                      (role) =>
                        role[1].alignment != "Event" && role[0] != "Host"
                    )
                    .map((role) => role[0])
                );
              }
            }
          }
          Challenges = Challenges.map((p) => `${p[0]}:${p[1]}:${p[2]}`);

          // Refresh the user's heart type to capacity

          let users = await models.User.find({ deleted: false }).select(
            "id -_id"
          );

          for (let userId of users) {
            let result1 = await models.User.updateOne(
              { id: userId.id },
              {
                $set: {
                  dailyChallenges: Challenges,
                },
              }
            ).exec();

            if (result1.modifiedCount === 0) {
              console.warn(
                `Failed to refresh daily challenges for userId[${userId.id}]`
              );
            }
            await redis.cacheUserInfo(userId.id, true);
          }
          // Remove the heart refresh so that it won't trigger again
          const result2 = await models.DailyChallengeRefresh.deleteOne({
            when: { $lt: now },
          }).exec();
          if (result2.deletedCount === 0) {
            console.warn(
              `Failed to delete daily Challenge refresh for userId[]`
            );
          }
          /*
          let dailyRefreshNew = await models.DailyChallengeRefresh.select("_id");
          if (!dailyRefreshNew) {
            dailyRefreshNew = new models.DailyChallengeRefresh({
              when: Date.now() + constants.dailyChallengesRefreshIntervalMillis,
            });
            await dailyRefreshNew.save();
          }
          */
        }
      },
      interval: 1000 * 60,
    },
    expireLeavePenalties: {
      run: async function () {
        const now = Date.now();

        // Query all heart refreshes that have elapsed
        let leavePenalties = await models.LeavePenalty.find({
          expiresOn: { $lt: now },
        }).select("userId type");
        for (let leavePenalty of leavePenalties) {
          const userId = leavePenalty.userId;

          // Remove the penalty, thereby resetting the penalty level back to default
          const result2 = await models.LeavePenalty.deleteOne({
            userId: userId,
          }).exec();
          if (result2.deletedCount === 0) {
            console.warn(
              `Failed to delete leave penalty for userId[${userId}]`
            );
          }
        }
      },
      interval: 1000 * 60 * 10,
    },
    gamesWebhook: {
      run: async function () {
        try {
          if (process.env.WEBHOOK_URL == null) return;

          var games = await redis.getOpenPublicGames();

          for (let game of games) {
            if (!game.webhookPublished) {
              await redis.gameWebhookPublished(game.id);
              await axios.post(process.env.WEBHOOK_URL, {
                username: "EpicMafia",
                content: `New ${game.type} game created: https://epicmafia.org/game/${game.id}`,
              });
            }
          }
        } catch (e) {
          logger.error(e);
        }
      },
      interval: 1000 * 10,
    },
    competitivePeriodic: {
      run: async function() {
        await competitive.progressCompetitive();
      },
      interval: 1000 * 300,
    },
  };

  for (let jobName in jobs) {
    jobs[jobName].run();
    setInterval(jobs[jobName].run, jobs[jobName].interval);
  }
};
