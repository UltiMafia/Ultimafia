const axios = require("axios");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const constants = require("../data/constants");
const models = require("../db/models");
const redis = require("./redis");
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
          }).select("_id players");

          for (let game of oldGames) {
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
    findNextRestart: {
      run: async function () {
        try {
          var count = await models.Restart.count({ when: { $lt: Date.now() } });
          await models.Restart.deleteMany({ when: { $lt: Date.now() } }).exec();

          // if (count > 0)
          //     child_process.spawn(path.join(__dirname, "update.sh"));
          // else {
          var restart = await models.Restart.find().sort("when");

          if (restart[0]) constants.restart = restart[0].when;
          else constants.restart = null;
          // }
        } catch (e) {
          logger.error(e);
        }
      },
      interval: 1000 * 10,
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
  };

  for (let jobName in jobs) {
    jobs[jobName].run();
    setInterval(jobs[jobName].run, jobs[jobName].interval);
  }
};
