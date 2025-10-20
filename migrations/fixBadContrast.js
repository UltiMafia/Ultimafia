// Users can set TEXT and TEXT color. if they set BAD VALUES => do a few things
const dotenv = require("dotenv").config(".env");
const db = require("../db/db");
const models = require("../db/models");
const redis = require("../modules/redis");
const { colorHasGoodContrastForBothThemes } = require("../lib/ColorUtils");

const fixBadContrast = async () => {
  try {
    await db.promise;

    console.log("Getting users...");
    let users = await models.User.find(
      {},
      "settings.nameColor settings.textColor id"
    );
    let user_idsWithBadNameColor = users
      .filter(
        (user) =>
          user?.settings?.nameColor &&
          !colorHasGoodContrastForBothThemes(user.settings.nameColor)
      )
      .map((user) => user._id);
    let user_idsWithBadTextColor = users
      .filter(
        (user) =>
          user?.settings?.textColor &&
          !colorHasGoodContrastForBothThemes(user.settings.textColor)
      )
      .map((user) => user._id);
    const userIdsWithBadSettings = users
      .filter((user) => {
        const badNameColor =
          user?.settings?.nameColor &&
          !colorHasGoodContrastForBothThemes(user.settings.nameColor);
        const badTextColor =
          user?.settings?.textColor &&
          !colorHasGoodContrastForBothThemes(user.settings.textColor);

        return badNameColor || badTextColor;
      })
      .map((user) => user.id);
    console.log(
      `Amount of users with bad NAME color:`,
      user_idsWithBadNameColor.length
    );
    console.log(
      `Amount of users with bad TEXT color:`,
      user_idsWithBadTextColor.length
    );

    console.log("Updating in MongoDB...");
    await models.User.updateMany(
      { _id: { $in: user_idsWithBadNameColor } },
      { $rename: { "settings.nameColor": "settings.warnNameColor" } }
    );
    await models.User.updateMany(
      { _id: { $in: user_idsWithBadTextColor } },
      { $rename: { "settings.textColor": "settings.warnTextColor" } }
    );
    console.log("Updated MongoDB!");

    console.log("Updating in Redis...");
    let count = 0;
    for (let userId of userIdsWithBadSettings) {
      if (count % 100 === 0) {
        console.log(`Redis settings updated: ${count}`);
      }
      await redis.cacheUserInfo(userId, true);
    }
    // const redisKeysToDelete = userIdsWithBadSettings.map(
    //   (id) => `user:${id}:info:settings`
    // );
    // console.log(userIdsWithBadSettings);
    // console.log(redisKeysToDelete);
    // if (redisKeysToDelete.length) {
    //   await redis.client.del(...redisKeysToDelete);
    // }
    console.log("Updated Redis!");

    users = await models.User.find({}, "settings.nameColor settings.textColor");
    user_idsWithBadNameColor = users
      .filter(
        (user) =>
          user?.settings?.nameColor &&
          !colorHasGoodContrastForBothThemes(user.settings.nameColor)
      )
      .map((user) => user._id);
    user_idsWithBadTextColor = users
      .filter(
        (user) =>
          user?.settings?.textColor &&
          !colorHasGoodContrastForBothThemes(user.settings.textColor)
      )
      .map((user) => user._id);
    console.log(
      `Amount of users with bad NAME color:`,
      user_idsWithBadNameColor.length
    );
    console.log(
      `Amount of users with bad TEXT color:`,
      user_idsWithBadTextColor.length
    );
  } catch (err) {
    console.log(err);
  } finally {
    process.exit(0);
  }
};

fixBadContrast();
