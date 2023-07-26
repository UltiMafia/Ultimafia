const express = require("express");
const bluebird = require("bluebird");
const fs = require("fs");
const fbAdmin = require("firebase-admin");
const formidable = bluebird.promisifyAll(require("formidable"), {
  multiArgs: true,
});
const sharp = require("sharp");
const color = require("color");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const constants = require("../data/constants");
const dbStats = require("../db/stats");
const logger = require("../modules/logging")(".");
const router = express.Router();

const youtubeRegex =
  /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]{11}).*/;

router.get("/info", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);

    if (!userId) {
      res.send({});
      return;
    }

    var user = await redis.getUserInfo(userId);

    if (!user) {
      res.send({});
      return;
    }

    user.csrf = req.session.user.csrf;
    user.inGame = await redis.inGame(user.id);
    user.perms = (await redis.getUserPermissions(userId)) || {};
    user.rank = String(user.perms.rank || 0);
    user.perms = user.perms.perms || {};
    delete user.status;

    res.send(user);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading user info");
  }
});

router.get("/searchName", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var query = routeUtils.strParseAlphaNum(req.query.query);
    var users = await models.User.find({
      name: new RegExp(query, "i"),
      deleted: false,
    })
      .select("id name avatar -_id")
      .limit(constants.mainUserSearchAmt)
      .sort("name");
    users = users.map((user) => user.toJSON());

    for (let user of users) user.status = await redis.getUserStatus(user.id);

    res.send(users);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/online", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var users = await redis.getOnlineUsersInfo(100);
    res.send(users);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/newest", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var last = Number(req.query.last);
    var first = Number(req.query.first);

    var users = await routeUtils.modelPageQuery(
      models.User,
      {},
      "joined",
      last,
      first,
      "id name avatar joined -_id",
      constants.newestUsersPageSize
    );

    res.send(users);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/flagged", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var last = Number(req.query.last);
    var first = Number(req.query.first);
    var perm = "viewFlagged";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var users = await routeUtils.modelPageQuery(
      models.User,
      { flagged: true },
      "joined",
      last,
      first,
      "id name avatar joined -_id",
      constants.newestUsersPageSize
    );

    res.send(users);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.post("/online", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);

    if (userId) redis.updateUserOnline(userId);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.sendStatus(200);
  }
});

router.get("/:id/profile", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var reqUserId = await routeUtils.verifyLoggedIn(req, true);
    var userId = String(req.params.id);
    var isSelf = reqUserId == userId;
    var user = await models.User.findOne({ id: userId, deleted: false })
      .select(
        "id name avatar settings accounts wins losses bio banner setups games numFriends stats -_id"
      )
      .populate({
        path: "setups",
        select: "id gameType name closed useRoleGroups count roles total -_id",
        options: {
          limit: 5,
        },
      })
      .populate({
        path: "games",
        select: "id setup endTime private broken -_id",
        populate: {
          path: "setup",
          select:
            "id gameType name closed useRoleGroups count roles total -_id",
        },
        options: {
          sort: "-endTime",
          limit: 5,
        },
      });

    if (!user) {
      res.status(500);
      res.send("Unable to load profile info.");
      return;
    }

    user = user.toJSON();
    user.groups = (await redis.getBasicUserInfo(userId)).groups;
    user.maxFriendsPage =
      Math.ceil(user.numFriends / constants.friendsPerPage) || 1;

    var allStats = dbStats.allStats();
    user.stats = user.stats || allStats;

    for (let gameType in allStats) {
      if (!user.stats[gameType])
        user.stats[gameType] = dbStats.statsSet(gameType);
      else {
        let statsSet = dbStats.statsSet(gameType);

        for (let objName in statsSet)
          if (!user.stats[gameType][objName])
            user.stats[gameType][objName] = statsSet[objName];
      }
    }

    if (isSelf) {
      var friendRequests = await models.FriendRequest.find({ targetId: userId })
        .select("userId user")
        .populate("user", "id name avatar");
      user.friendRequests = friendRequests.map((req) => req.user);
    } else user.friendRequests = [];

    for (let game of user.games)
      if (game.status == null) game.status = "Finished";

    var inGame = await redis.inGame(userId);
    var game;

    if (inGame) game = await redis.getGameInfo(inGame);

    if (game && !game.settings.private) {
      game.settings.setup = await models.Setup.findOne({
        id: game.settings.setup,
      }).select("id gameType name roles closed useRoleGroups count total -_id");
      game.settings.setup = game.settings.setup.toJSON();

      game = {
        id: game.id,
        setup: {
          id: game.settings.setup.id,
          gameType: game.settings.setup.gameType,
          name: game.settings.setup.name,
          closed: game.settings.setup.closed,
          useRoleGroups: game.settings.setup.useRoleGroups,
          count: game.settings.setup.count,
          roles: game.settings.setup.roles,
          total: game.settings.setup.total,
        },
        players: game.players.length,
        status: game.status,
        scheduled: game.settings.scheduled,
        spectating: game.settings.spectating,
        ranked: game.settings.ranked,
        voiceChat: game.settings.voiceChat,
        hideClosedRoles: game.settings.hideClosedRoles,
      };

      user.games.unshift(game);
    }

    if (!user.settings) user.settings = {};

    if (userId) {
      user.isFriend =
        (await models.FriendRequest.findOne({
          userId: reqUserId,
          targetId: userId,
        })) != null;

      if (!user.isFriend)
        user.isFriend =
          (await models.Friend.findOne({
            userId: reqUserId,
            friendId: userId,
          })) != null;
    } else user.isFriend = false;

    res.send(user);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to load profile info.");
  }
});

router.get("/:id/friends", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = String(req.params.id);
    var last = Number(req.query.last);
    var first = Number(req.query.first);

    var friends = await routeUtils.modelPageQuery(
      models.Friend,
      { userId },
      "lastActive",
      last,
      first,
      "friendId friend lastActive -_id",
      constants.friendsPerPage,
      ["friend", "id name avatar -_id"]
    );

    friends = friends.map((friend) => {
      friend = friend.toJSON();

      return {
        ...friend.friend,
        lastActive: friend.lastActive,
      };
    });

    res.send(friends);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to load friends.");
  }
});

router.get("/:id/info", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var user = await models.User.findOne({
      id: req.params.id,
      deleted: false,
    }).select("name tag wins losses rankPoints -_id");

    if (!user) {
      res.status(500);
      res.send("Unable to find user.");
      return;
    }

    user = user.toJSON();

    if (global.players[req.params.id])
      user.inGame = global.players[req.params.id].id;
    else user.inGame = "No";

    res.send(user);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to find user");
  }
});

router.get("/settings/data", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var user =
      userId &&
      (await models.User.findOne({ id: userId, deleted: false }).select(
        "name birthday settings -_id"
      ));

    if (user) {
      user = user.toJSON();

      if (!user.settings) user.settings = {};

      user.settings.username = user.name;
      user.birthday = Date.parse(user.birthday);
      res.send(user.settings);
    } else res.send({});
  } catch (e) {
    logger.error(e);
    res.send("Unable to load settings");
  }
});

router.get("/accounts", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var user =
      userId &&
      (await models.User.findOne({ id: userId, deleted: false }).select(
        "accounts -_id"
      ));

    if (user) res.send(user.accounts);
    else res.send({});
  } catch (e) {
    logger.error(e);
    res.send("Unable to load settings");
  }
});

router.post("/youtube", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let userId = await routeUtils.verifyLoggedIn(req);
    let prop = String(req.body.prop);
    let value = String(req.body.link);

    if (value.length > 200) {
      throw new Error("URL is too long");
    }

    let matches = value.match(youtubeRegex);
    let matches2 = value.match(/^https?:\/\/.*?\.(ogg|mp3|mp4|webm)$/);
    if (matches) {
      let embedId = 0;
      if (matches && matches.length >= 7) {
        embedId = matches[7];
      }
      let embedIndex = value.indexOf(embedId);

      // Youtube video IDs are 11 characters, so get the substring,
      // & end at the end of the found embedID.
      value = value.substring(0, embedIndex + 11);

      await models.User.updateOne(
        { id: userId },
        { $set: { [`settings.youtube`]: value } }
      );
    } else if (matches2) {
      await models.User.updateOne(
        { id: userId },
        { $set: { [`settings.youtube`]: value } }
      );
    } else {
      throw new Error("Invalid URL");
    }

    await redis.cacheUserInfo(userId, true);
    res.send("Media updated successfully.");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating media.");
  }
});

router.post("/deathMessage", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "name"
    );

    var itemsOwned = await redis.getUserItemsOwned(userId);
    let deathMessage = String(req.body.deathMessage);

    if (!itemsOwned.deathMessageEnabled) {
      res.status(500);
      res.send("You must custom death messages from the Shop.");
      return;
    }

    if (itemsOwned.deathMessageChange < 1) {
      res.status(500);
      res.send(
        "You must purchase additional death messages changes from the Shop."
      );
      return;
    }

    // truncate to 80 chars
    if (deathMessage.length > 80) {
      deathMessage = deathMessage.substring(0, 80);
    }

    if (!deathMessage.includes("${name}")) {
      res.status(500);
      res.send(
        "You must use ${name} in the death message as a placeholder for your username."
      );
      return;
    }

    await models.User.updateOne(
      { id: userId },
      {
        $set: { [`settings.deathMessage`]: deathMessage },
        $inc: { "itemsOwned.deathMessageChange": -1 },
      }
    ).exec();
    await redis.cacheUserInfo(userId, true);
    res.send("Death message updated successfully");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating death message.");
  }
});

router.post("/settings/update", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var prop = String(req.body.prop);
    var value = String(req.body.value);

    if (!routeUtils.validProp(prop)) {
      logger.warn(`Invalid settings prop by ${userId}: ${prop}`);
      res.status(500);
      res.send("Error updating settings.");
      return;
    }

    var itemsOwned = await redis.getUserItemsOwned(userId);

    if (
      (prop == "backgroundColor" || prop == "bannerFormat") &&
      !itemsOwned.customProfile
    ) {
      res.status(500);
      res.send(
        "You must purchase profile customization with coins from the Shop."
      );
      return;
    }

    if (
      (prop == "textColor" || prop == "nameColor") &&
      !itemsOwned.textColors
    ) {
      res.status(500);
      res.send("You must purchase text colors with coins from the Shop.");
      return;
    }

    await models.User.updateOne(
      { id: userId },
      { $set: { [`settings.${prop}`]: value } }
    );
    await redis.cacheUserInfo(userId, true);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating settings.");
  }
});

router.post("/bio", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var bio = String(req.body.bio);
    var perm = "editBio";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (bio.length < 10000) {
      await models.User.updateOne({ id: userId }, { $set: { bio: bio } });
      res.sendStatus(200);
    } else if (bio.length >= 10000) {
      res.status(500);
      res.send("Bio must be less than 10000 characters");
    } else {
      res.status(500);
      res.send("Error editing bio");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error editing bio");
  }
});

router.post("/banner", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var itemsOwned = await redis.getUserItemsOwned(userId);

    if (!itemsOwned.customProfile) {
      res.status(500);
      res.send(
        "You must purcahse profile customization with coins from the Shop."
      );
      return;
    }

    var form = new formidable();
    form.maxFileSize = 2 * 1024 * 1024;
    form.maxFields = 1;

    var [fields, files] = await form.parseAsync(req);

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}`))
      fs.mkdirSync(`${process.env.UPLOAD_PATH}`);

    await sharp(files.image.path)
      .resize({
        width: 980,
        height: 200,
        withoutEnlargement: true,
      })
      .toFile(`${process.env.UPLOAD_PATH}/${userId}_banner.jpg`);
    await models.User.updateOne({ id: userId }, { $set: { banner: true } });

    res.sendStatus(200);
  } catch (e) {
    res.status(500);

    if (e.message.indexOf("maxFileSize exceeded") == 0)
      res.send("Image is too large, banner must be less than 2 MB");
    else {
      logger.error(e);
      res.send("Error uploading avatar image");
    }
  }
});

router.post("/avatar", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var form = new formidable();
    form.maxFileSize = 1024 * 1024;
    form.maxFields = 1;

    var [fields, files] = await form.parseAsync(req);

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}`))
      fs.mkdirSync(`${process.env.UPLOAD_PATH}`);

    await sharp(files.image.path)
      .resize(100, 100)
      .toFile(`${process.env.UPLOAD_PATH}/${userId}_avatar.jpg`);
    await models.User.updateOne({ id: userId }, { $set: { avatar: true } });
    await redis.cacheUserInfo(userId, true);

    res.sendStatus(200);
  } catch (e) {
    res.status(500);

    if (e.message.indexOf("maxFileSize exceeded") == 0)
      res.send("Image is too large, avatar must be less than 1 MB.");
    else {
      logger.error(e);
      res.send("Error uploading avatar image.");
    }
  }
});

router.post("/birthday", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let userId = await routeUtils.verifyLoggedIn(req);
    var bdayChanged = await redis.getUserInfo(userId).nameChanged;
    var perm = "changeBday";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) {
      return;
    }

    if (bdayChanged) {
      res.status(500);
      res.send(
        "You have already changed your birthday. Please contact a moderator if you need to reset it."
      );
      return;
    }

    let value = String(req.body.date);
    await models.User.updateOne(
      { id: userId },
      {
        $set: { birthday: value, bdayChanged: true },
      }
    ).exec();
    await redis.cacheUserInfo(userId, true);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating birthday.");
  }
});

router.post("/name", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var itemsOwned = await redis.getUserItemsOwned(userId);
    var name = String(req.body.name);
    var code = String(req.body.code);
    var perm = "changeName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (name.length == 3 && !itemsOwned.threeCharName) {
      res.status(500);
      res.send(
        "You must purchase 3 character usernames with coins from the Shop."
      );
      return;
    }

    if (name.length == 2 && !itemsOwned.twoCharName) {
      res.status(500);
      res.send(
        "You must purchase 2 character usernames with coins from the Shop."
      );
      return;
    }

    if (name.length == 1 && !itemsOwned.oneCharName) {
      res.status(500);
      res.send(
        "You must purchase 1 character usernames with coins from the Shop."
      );
      return;
    }

    if (name.length < 1 || name.length > constants.maxUserNameLength) {
      res.status(500);
      res.send(
        `Names must be between 4 and ${constants.maxUserNameLength} characters.`
      );
      return;
    }

    if (!name.match(routeUtils.usernameRegex)) {
      res.status(500);
      res.send(
        "Names can only contain letters, numbers, and nonconsecutive undescores/hyphens."
      );
      return;
    }

    var ownedItems = await redis.getUserItemsOwned(userId);

    if (ownedItems.nameChange < 1) {
      res.status(500);
      res.send(
        "You must purchase additional name changes with coins from the Shop."
      );
      return;
    }

    var existingUser = await models.User.findOne({
      name: new RegExp(`^${name}$`, "i"),
    }).select("_id");

    if (existingUser) {
      res.status(500);
      res.send("There is already a user with this name.");
      return;
    }

    var blockedName = await models.BlockedName.findOne({
      name: new RegExp(`^${name}$`, "i"),
    }).select("_id");

    if (blockedName) {
      res.status(500);
      res.send("There is already a user with this name.");
      return;
    }

    var reservationCode = reservedNames[name.toLowerCase()];

    if (reservationCode) {
      if (code != reservationCode) {
        res.status(500);
        res.send("Invalid reservation code.");
        return;
      }
    }

    await models.User.updateOne(
      { id: userId },
      {
        $set: { name: name, nameChanged: true },
        $inc: { "itemsOwned.nameChange": -1 },
      }
    ).exec();
    await redis.cacheUserInfo(userId, true);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error changing username");
  }
});

router.post("/block", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToBlock = String(req.body.user);

    if (userId == userIdToBlock) {
      res.status(500);
      res.send("You cannot block yourself.");
      return;
    }

    var userToBlock = await models.User.findOne({ id: userIdToBlock }).select(
      "_id"
    );

    if (!userToBlock) {
      res.status(500);
      res.send("User not found.");
      return;
    }

    var user = await models.User.findOne({ id: userId }).select("blockedUsers");

    if (user.blockedUsers.indexOf(userIdToBlock) == -1) {
      await models.User.updateOne(
        { id: userId },
        { $push: { blockedUsers: userIdToBlock } }
      ).exec();
    } else {
      await models.User.updateOne(
        { id: userId },
        { $pull: { blockedUsers: userIdToBlock } }
      ).exec();
    }

    await redis.cacheUserInfo(userId, true);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error blocking user.");
  }
});

router.post("/friend", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userName = await redis.getUserName(userId);
    var userIdToFriend = String(req.body.user);

    if (userId == userIdToFriend) {
      res.status(500);
      res.send("You cannot be friends with yourself.");
      return;
    }

    var existingRequest = await models.FriendRequest.findOne({
      userId,
      targetId: userIdToFriend,
    }).select("_id");

    // Cancel existing request
    if (existingRequest) {
      await models.FriendRequest.deleteOne({
        userId,
        targetId: userIdToFriend,
      }).exec();
      res.send("Friend request cancelled.");
      return;
    }

    var existingFriend = await models.Friend.findOne({
      userId,
      friendId: userIdToFriend,
    }).select("_id");

    // Unfriend
    if (existingFriend) {
      await models.Friend.deleteOne({
        userId,
        friendId: userIdToFriend,
      }).exec();
      await models.Friend.deleteOne({
        userId: userIdToFriend,
        friendId: userId,
      }).exec();

      await models.User.updateMany(
        { id: { $in: [userId, userIdToFriend] } },
        { $inc: { numFriends: -1 } }
      ).exec();

      res.send("Unfriended this user.");
      return;
    }

    existingRequest = await models.FriendRequest.findOne({
      userId: userIdToFriend,
      targetId: userId,
    }).select("_id");

    // Accept existing request
    if (existingRequest) {
      var userToFriend = await models.User.findOne({
        id: userIdToFriend,
      }).select("lastActive");

      var friend = new models.Friend({
        userId: userId,
        friendId: userIdToFriend,
        lastActive: Date.now(),
      });
      await friend.save();

      friend = new models.Friend({
        userId: userIdToFriend,
        friendId: userId,
        lastActive: userToFriend.lastActive || Date.now(),
      });
      await friend.save();

      await models.FriendRequest.deleteOne({
        userId: userIdToFriend,
        targetId: userId,
      }).exec();

      await models.User.updateMany(
        { id: { $in: [userId, userIdToFriend] } },
        { $inc: { numFriends: 1 } }
      ).exec();

      await routeUtils.createNotification(
        {
          content: `${userName} accepted your friend request.`,
          icon: "fas fa-users",
          link: `/user/${userId}`,
        },
        [userIdToFriend]
      );

      res.send("Friend request accepted.");
      return;
    }

    // Create new request
    var request = new models.FriendRequest({
      userId: userId,
      targetId: userIdToFriend,
    });
    await request.save();

    await routeUtils.createNotification(
      {
        content: `${userName} sent a friend request.`,
        icon: "fas fa-users",
        link: `/user/${userId}`,
      },
      [userIdToFriend]
    );

    res.send("Friend request sent.");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error sending friend request.");
  }
});

router.post("/friend/reject", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var requestFrom = String(req.body.user);

    await models.FriendRequest.deleteOne({
      userId: requestFrom,
      targetId: userId,
    }).exec();

    res.send("Friend request rejected.");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error rejecting friend request.");
  }
});

router.post("/referred", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var referrer = String(req.body.referrer);
    var user = await models.User.findOne({ id: userId }).select("referrer ip");

    if (user.referrer) {
      res.sendStatus(200);
      return;
    }

    var referrerUser = await models.User.findOne({ id: referrer }).select("ip");

    for (let ip of user.ip) {
      if (referrerUser.ip.indexOf(ip) != -1) {
        res.sendStatus(200);
        return;
      }
    }

    await models.User.updateOne({ id: userId }, { $set: { referrer } }).exec();
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.sendStatus(200);
  }
});

router.post("/unlink", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "accounts"
    );
    var account = String(req.body.account);
    var accountCount = 0;

    if (user) {
      user = user.toJSON();

      for (let accountName in user.accounts)
        if (user.accounts[accountName] && user.accounts[accountName].id)
          accountCount++;

      if (accountCount > 1) {
        delete user.accounts[account];
        models.User.updateOne(
          { id: userId },
          { $unset: { [`accounts.${account}`]: "" } }
        ).exec();
        res.send(user.accounts);
      } else {
        res.status(500);
        res.send("You must have at least one linked account.");
      }
    } else {
      res.status(500);
      res.send("Error unlinking account.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error unlinking account.");
  }
});

router.post("/logout", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    await models.Session.deleteMany({ "session.user.id": userId }).exec();
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error logging out.");
  }
});

router.post("/delete", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var fbUid = req.session.user.fbUid;
    var dbId = req.session.user._id;
    var ip = routeUtils.getIP(req);

    if (!(await routeUtils.rateLimit(ip, "deleteAccount", res))) return;

    // await models.Session.deleteMany({ "session.user.id": userId }).exec();
    req.session.destroy();

    await models.ChannelOpen.deleteMany({ user: userId }).exec();
    await models.Notification.deleteMany({ user: userId }).exec();
    await models.Friend.deleteMany({ userId }).exec();
    await models.FriendRequest.deleteMany({
      $or: [{ userId: userId }, { friendId: userId }],
    }).exec();
    await models.InGroup.deleteMany({ user: dbId }).exec();
    await models.User.updateOne(
      { id: userId },
      {
        $set: {
          name: "[deleted]",
          lastActive: 0,
          deleted: true,
        },
        $unset: {
          fbUid: "",
          avatar: "",
          banner: "",
          bio: "",
          settings: "",
          numFriends: "",
          dev: "",
          rank: "",
          permissions: "",
          setups: "",
          favSetups: "",
          games: "",
          globalNotifs: "",
          blockedUsers: "",
          coins: "",
          itemsOwned: "",
          stats: "",
        },
      }
    ).exec();

    await fbAdmin.auth().deleteUser(fbUid);
    await redis.setUserOffline(userId);
    await redis.deleteUserInfo(userId);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting account.");
  }
});

const reservedNames = JSON.parse(process.env.RESERVED_NAMES);

module.exports = router;
