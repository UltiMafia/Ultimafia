// Users can set TEXT and TEXT color. if they set BAD VALUES => do a few things
const path = require("path");
const dotenv = require("dotenv").config(".env");
const db = require("../db/db");
const models = require("../db/models");
const { colorHasGoodBackgroundContrast } = require("../shared/colors");

const fixBadContrast = async () => {
  try {
    await db.promise;

    console.log("Getting users...");
    let users = await models.User.find(
      {},
      "settings.nameColor settings.textColor"
    );
    let userIdsWithBadNameColor = users
      .filter(
        (user) =>
          user?.settings?.nameColor &&
          !colorHasGoodBackgroundContrast(user.settings.nameColor)
      )
      .map((user) => user._id);
    let userIdsWithBadTextColor = users
      .filter(
        (user) =>
          user?.settings?.textColor &&
          !colorHasGoodBackgroundContrast(user.settings.textColor)
      )
      .map((user) => user._id);

    console.log(
      `Amount of users with bad NAME color:`,
      userIdsWithBadNameColor.length
    );
    console.log(
      `Amount of users with bad TEXT color:`,
      userIdsWithBadTextColor.length
    );
    await models.User.updateMany(
      { _id: { $in: userIdsWithBadNameColor } },
      { $rename: { "settings.nameColor": "settings.warnNameColor" } }
    );
    await models.User.updateMany(
      { _id: { $in: userIdsWithBadTextColor } },
      { $rename: { "settings.textColor": "settings.warnTextColor" } }
    );
    console.log("Updated!");

    users = await models.User.find({}, "settings.nameColor settings.textColor");
    userIdsWithBadNameColor = users
      .filter(
        (user) =>
          user?.settings?.nameColor &&
          !colorHasGoodBackgroundContrast(user.settings.nameColor)
      )
      .map((user) => user._id);
    userIdsWithBadTextColor = users
      .filter(
        (user) =>
          user?.settings?.textColor &&
          !colorHasGoodBackgroundContrast(user.settings.textColor)
      )
      .map((user) => user._id);
    console.log(
      `Amount of users with bad NAME color:`,
      userIdsWithBadNameColor.length
    );
    console.log(
      `Amount of users with bad TEXT color:`,
      userIdsWithBadTextColor.length
    );
  } catch (err) {
    console.log(err);
  } finally {
    process.exit(0);
  }
};

fixBadContrast();
