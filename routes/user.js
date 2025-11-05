const express = require("express");
const bluebird = require("bluebird");
const fs = require("fs");
const fbAdmin = require("firebase-admin");
const formidable = bluebird.promisifyAll(require("formidable"), {
  multiArgs: true,
});
const sharp = require("sharp");
const shortid = require("shortid");
const color = require("color");
const models = require("../db/models");
const routeUtils = require("./utils");
const utils = require("../lib/Utils");
const redis = require("../modules/redis");
const constants = require("../data/constants");
const dbStats = require("../db/stats");
const { colorHasGoodContrastForBothThemes } = require("../shared/colors");
const logger = require("../modules/logging")(".");
const router = express.Router();

// Helper function to resolve user ID from identifier (ID or vanity URL)
async function resolveUserId(identifier) {
  // First try to find user by ID
  let user = await models.User.findOne({
    id: identifier,
    deleted: false,
  }).select("id -_id");

  if (user) {
    return user.id;
  }

  // If not found by ID, try to find by vanity URL
  const vanityUrl = await models.VanityUrl.findOne({
    url: identifier,
  }).select("userId -_id");

  if (vanityUrl) {
    // Verify the user still exists and is not deleted
    const userByVanity = await models.User.findOne({
      id: vanityUrl.userId,
      deleted: false,
    }).select("id -_id");

    if (userByVanity) {
      return userByVanity.id;
    }
  }

  return null;
}
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;

const youtubeRegex =
  /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]{11}).*/;
const soundcloudRegex = /^https?:\/\/(www\.)?soundcloud\.com\/[^\/]+\/[^\/\?]+/;
const spotifyRegex =
  /^https?:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+/;
const bandcampRegex =
  /^https?:\/\/([^\/]+\.)?bandcamp\.com\/(track|album)\/[^\/\?]+/;
const vimeoRegex = /^https?:\/\/(www\.)?vimeo\.com\/(\d+)/;
const invidiousRegex =
  /^https?:\/\/(www\.)?(invidious\.io|yewtu\.be|invidious\.flokinet\.to|invidious\.nixnet\.xyz|invidious\.privacydev\.net|invidious\.kavin\.rocks|invidious\.tux\.pizza|invidious\.projectsegfau\.lt|invidious\.riverside\.rocks|invidious\.busa\.co|invidious\.tinfoil-hat\.net|invidious\.jotoma\.de|invidious\.fdn\.fr|invidious\.mastodon\.host|invidious\.lelux\.fi|invidious\.mint\.lgbt|invidious\.fdn\.fr|invidious\.lelux\.fi|invidious\.mint\.lgbt|invidious\.nixnet\.xyz|invidious\.privacydev\.net|invidious\.kavin\.rocks|invidious\.tux\.pizza|invidious\.projectsegfau\.lt|invidious\.riverside\.rocks|invidious\.busa\.co|invidious\.tinfoil-hat\.net|invidious\.jotoma\.de|invidious\.fdn\.fr|invidious\.mastodon\.host|invidious\.lelux\.fi|invidious\.mint\.lgbt)\/watch\?v=([a-zA-Z0-9_-]{11})/;

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

router.get("/leaderboard", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var leadingKarmaUsers = await redis.getLeaderBoardStat("karma");
    var leadingKudosUsers = await redis.getLeaderBoardStat("kudos");
    var leadingStatsUsers = await redis.getLeaderBoardStat("winRate");
    var leadingAchievementUsers = await redis.getLeaderBoardStat(
      "achievementCount"
    );
    var leadingDailyChallengesUsers = await redis.getLeaderBoardStat(
      "dailyChallengesCompleted"
    );

    res.send({
      leadingKarmaUsers: leadingKarmaUsers,
      leadingKudosUsers: leadingKudosUsers,
      leadingStatsUsers: leadingStatsUsers,
      leadingAchievementUsers: leadingAchievementUsers,
      leadingDailyChallengesUsers: leadingDailyChallengesUsers,
    });
  } catch (e) {
    logger.error(e);
    res.send([]);
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

    // First try to find user by ID
    var userById = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("id -_id");

    // If not found by ID, try to find by vanity URL
    if (!userById) {
      const vanityUrl = await models.VanityUrl.findOne({
        url: userId,
      }).select("userId -_id");

      if (!vanityUrl) {
        // Check if this was a recently deleted vanity URL
        const deletedVanityUserId = await redis.getDeletedVanityUrlUserId(
          userId
        );
        if (deletedVanityUserId) {
          // Redirect to the user's ID instead
          userId = deletedVanityUserId;
        } else {
          res.status(404);
          res.send("User not found.");
          return;
        }
      } else {
        const userByVanity = await models.User.findOne({
          id: vanityUrl.userId,
          deleted: false,
        }).select("id -_id");

        if (!userByVanity) {
          res.status(404);
          res.send("User not found.");
          return;
        }

        userId = userByVanity.id;
      }
    }

    var isSelf = reqUserId == userId;
    var user = await models.User.findOne({ id: userId, deleted: false })
      .select(
        "id name avatar settings accounts wins losses kudos karma points pointsNegative achievements bio pronouns banner setups games numFriends stats lastActive _id"
      )
      .populate({
        path: "setups",
        select:
          "id gameType name closed useRoleGroups roleGroupSizes count roles total -_id",
        options: {
          limit: 5,
        },
      })
      .populate({
        path: "games",
        select:
          "id setup lobby endTime private broken ranked competitive spectating anonymousGame -_id",
        populate: {
          path: "setup",
          select:
            "id gameType name closed useRoleGroups roleGroupSizes count roles total -_id",
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

    var userMongoId = user._id;
    delete user._id;

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

    var archivedGames = await models.ArchivedGame.find({ user: userMongoId })
      .select("game description")
      .populate({
        path: "game",
        select:
          "id setup lobby endTime private broken ranked competitive spectating anonymousGame -_id",
        populate: {
          path: "setup",
          select:
            "id gameType name closed useRoleGroups roleGroupSizes count roles total -_id",
        },
        options: {
          sort: "-endTime",
          limit: constants.maxArchivedGamesMax,
        },
      });
    user.archivedGames = archivedGames.map((item) => {
      return {
        ...item.game._doc,
        description: item.description,
        status: "Finished",
      };
    });

    var karmaInfo = { voteCount: user.karma, vote: 0 };
    var karmaVote = await models.KarmaVote.findOne({
      voterId: reqUserId,
      targetId: userId,
    });
    if (karmaVote) {
      karmaInfo.vote = karmaVote.direction;
    }
    user.karmaInfo = karmaInfo;
    user.achievements = user.achievements;
    if (isSelf) {
      var friendRequests = await models.FriendRequest.find({ targetId: userId })
        .select("userId user")
        .populate("user", "id name avatar");

      // Add vanity URLs to friend requests
      user.friendRequests = await Promise.all(
        friendRequests.map(async (req) => {
          const vanityUrl = await models.VanityUrl.findOne({
            userId: req.user.id,
          }).select("url -_id");

          return {
            ...req.user.toJSON(),
            vanityUrl: vanityUrl?.url,
          };
        })
      );
    } else user.friendRequests = [];

    for (let game of user.games)
      if (game.status == null) game.status = "Finished";

    var inGame = await redis.inGame(userId);
    var game;

    if (inGame) game = await redis.getGameInfo(inGame);

    if (game && !game.settings.private) {
      game.settings.setup = await models.Setup.findOne({
        id: game.settings.setup,
      }).select(
        "id gameType name roles closed useRoleGroups roleGroupSizes count total -_id"
      );
      game.settings.setup = game.settings.setup.toJSON();

      game = {
        id: game.id,
        setup: {
          id: game.settings.setup.id,
          gameType: game.settings.setup.gameType,
          name: game.settings.setup.name,
          closed: game.settings.setup.closed,
          useRoleGroups: game.settings.setup.useRoleGroups,
          roleGroupSizes: game.settings.setup.roleGroupSizes,
          count: game.settings.setup.count,
          roles: game.settings.setup.roles,
          total: game.settings.setup.total,
        },
        players: game.players.length,
        status: game.status,
        scheduled: game.settings.scheduled,
        spectating: game.settings.spectating,
        lobbyName: game.settings.lobbyName,
        ranked: game.settings.ranked,
        competitive: game.settings.competitive,
      };

      user.games.unshift(game);
    }

    user.love = await models.Love.findOne({ userId })
      .select("loveId type")
      .populate({
        path: "love",
        select: "id name avatar -_id",
      });

    if (user.love !== null) {
      user.love = user.love.toJSON();
      user.love.love.type = user.love.type;
      user.love = user.love.love;

      if (!isSelf && user.love.type === "Lover") {
        var docSave = await models.DocSave.find({
          $or: [
            { $and: [{ userId: userId }, { saverId: reqUserId }] },
            { $and: [{ userId: reqUserId }, { saverId: userId }] },
          ],
        });
        if (docSave.length > 0) {
          user.saved = true;
        }
      }
    } else {
      user.love = {};
    }

    user.currentLove = await models.Love.findOne({ userId: reqUserId }).select(
      "userId loveId type -_id"
    );

    if (!user.settings) user.settings = {};

    if (user.settings.hideKarma) {
      delete user.karmaInfo;
    }
    if (user.settings.hidePointsNegative) {
      delete user.pointsNegative;
    }

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

    user.isLove = false;
    user.isMarried = false;
    if (userId) {
      if (Object.keys(user.love).length !== 0) {
        if (user.love.type === "Married") {
          user.isMarried = true;
        } else if (user.love.type === "Lover") {
          user.isMarried =
            (await models.LoveRequest.findOne({
              userId: reqUserId,
              targetId: userId,
              type: "Married",
            })) != null;
          if (!user.isMarried) {
            user.isLove = true;
          }
        }
      } else {
        user.isLove =
          (await models.LoveRequest.findOne({
            userId: reqUserId,
            targetId: userId,
            type: "Lover",
          })) != null;
      }
    }

    // Add online status and last active time
    user.status = await redis.getUserStatus(userId);
    user.lastActive = user.lastActive;

    // Add vanity URL if exists
    const vanityUrl = await models.VanityUrl.findOne({
      userId: userId,
    }).select("url -_id");

    if (vanityUrl) {
      user.vanityUrl = vanityUrl.url;
    }

    res.send(user);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to load profile info.");
  }
});

router.post("/karma", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var targetId = String(req.body.targetId);
    var perm = "vote";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) {
      return;
    }

    var user = await models.User.findOne({
      id: targetId,
      deleted: false,
    }).select("-_id");

    if (!user) {
      res.status(500);
      res.send("Unable to find user.");
      return;
    }

    if (!(await routeUtils.rateLimit(userId, "vote", res))) return;

    var direction = Number(req.body.direction);

    if (direction != 1 && direction != -1) {
      res.status(500);
      res.send("Bad vote direction");
      return;
    }

    var vote = await models.KarmaVote.findOne({
      voterId: userId,
      targetId: targetId,
    });

    if (!vote) {
      vote = new models.KarmaVote({
        voterId: userId,
        targetId: targetId,
        direction: direction,
      });
      await vote.save();

      await models.User.updateOne(
        { id: targetId },
        { $inc: { karma: direction } }
      ).exec();

      res.send(String(direction));
    } else if (vote.direction != direction) {
      await models.KarmaVote.updateOne(
        { voterId: userId, targetId: targetId },
        { $set: { direction: direction } }
      ).exec();

      await models.User.updateOne(
        { id: targetId },
        { $inc: { karma: 2 * direction } }
      ).exec();

      res.send(String(direction));
    } else {
      await models.KarmaVote.deleteOne({
        voterId: userId,
        targetId: targetId,
      }).exec();

      await models.User.updateOne(
        { id: targetId },
        { $inc: { karma: -1 * direction } }
      ).exec();

      res.send("0");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error voting.");
  }
});

router.get("/:id/love", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const identifier = String(req.params.id);
    const userId = await resolveUserId(identifier);

    if (!userId) {
      res.status(404);
      res.send("User not found.");
      return;
    }

    var love = await models.Love.findOne({ userId })
      .select("loveId type")
      .populate({
        path: "love",
        select: "id name avatar -_id",
      });

    if (love) {
      love = love.toJSON();
      love.love.type = love.type;

      res.send(love.love);
    } else {
      res.send({});
    }
  } catch (e) {
    logger.error(e);
    res.send("Unable to load love.");
  }
});

router.get("/:id/friends", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const identifier = String(req.params.id);
    const userId = await resolveUserId(identifier);

    if (!userId) {
      res.status(404);
      res.send("User not found.");
      return;
    }

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

    friends = await Promise.all(
      friends.map(async (friend) => {
        friend = friend.toJSON();

        // Get vanity URL for friend
        const vanityUrlObj = await models.VanityUrl.findOne({
          userId: friend.friendId,
        }).select("url -_id");

        let vanityUrl = null;
        if (vanityUrlObj) {
          vanityUrl = vanityUrlObj.url;
        }

        return {
          ...friend.friend,
          lastActive: friend.lastActive,
          vanityUrl: vanityUrl,
        };
      })
    );

    res.send(friends);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to load friends.");
  }
});

router.get("/:id/info", async function (req, res) {
  try {
    const identifier = String(req.params.id);
    const userId = await resolveUserId(identifier);

    if (!userId) {
      res.status(404);
      res.send({
        name: "[not found]",
        avatar: false,
      });
      return;
    }

    var user = await redis.getUserInfo(userId);

    if (!user) {
      res.status(404);
      res.send({
        name: "[not found]",
        avatar: false,
      });
      return;
    }

    user.csrf = req.session.user.csrf;
    user.inGame = await redis.inGame(user.id);
    user.perms = (await redis.getUserPermissions(req.params.id)) || {};
    user.rank = String(user.perms.rank || 0);
    user.perms = user.perms.perms || {};

    // Get online status and last active time
    user.status = await redis.getUserStatus(user.id);
    const userDoc = await models.User.findOne({ id: user.id }).select(
      "lastActive -_id"
    );
    user.lastActive = userDoc?.lastActive;

    res.send(user);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting user");
  }
});

router.get("/settings/data", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const maxOwnedCustomEmotes =
      constants.maxOwnedCustomEmotes + constants.maxOwnedCustomEmotesExtra;

    var userId = await routeUtils.verifyLoggedIn(req, true);
    var user =
      userId &&
      (await models.User.findOne({ id: userId, deleted: false })
        .select("name birthday pronouns settings customEmotes -_id")
        .populate({
          path: "customEmotes",
          select: "id extension name -_id",
          options: { limit: maxOwnedCustomEmotes },
        }));

    if (user) {
      user = user.toJSON();

      if (!user.settings) user.settings = {};

      user.settings.username = user.name;
      user.settings.pronouns = user.pronouns;
      user.birthday = Date.parse(user.birthday);
      utils.remapCustomEmotes(user, userId);

      // Fetch vanity URL
      const vanityUrl = await models.VanityUrl.findOne({
        userId: userId,
      }).select("url -_id");

      if (vanityUrl) {
        user.settings.vanityUrl = vanityUrl.url;
      }

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

router.post("/bandcamp/oembed", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const { url } = req.body;

    if (!url || !url.match(bandcampRegex)) {
      throw new Error("Invalid Bandcamp URL");
    }

    // Call Bandcamp's oEmbed API
    const oembedUrl = `https://bandcamp.com/api/oembed/1.0?url=${encodeURIComponent(
      url
    )}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch Bandcamp oEmbed data");
    }

    const data = await response.json();
    res.send(data);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error fetching Bandcamp embed data");
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
    let soundcloudMatches = value.match(soundcloudRegex);
    let spotifyMatches = value.match(spotifyRegex);
    let bandcampMatches = value.match(bandcampRegex);
    let vimeoMatches = value.match(vimeoRegex);
    let invidiousMatches = value.match(invidiousRegex);
    let directMediaMatches = value.match(
      /^https?:\/\/.*?\.(ogg|mp3|mp4|webm)$/
    );
    let emptyMatches = value.match(/^$/g);

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
    } else if (
      soundcloudMatches ||
      spotifyMatches ||
      bandcampMatches ||
      vimeoMatches ||
      invidiousMatches ||
      directMediaMatches ||
      emptyMatches
    ) {
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
      res.send("You must purchase custom death messages from the Shop.");
      return;
    }

    if (itemsOwned.deathMessageChange < 1) {
      res.status(500);
      res.send(
        "You must purchase additional death messages changes from the Shop."
      );
      return;
    }

    // truncate to 150 chars
    if (deathMessage.length > 150) {
      deathMessage = deathMessage.substring(0, 150);
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

// Vanity URL routes moved to /api/vanityUrl

router.post("/customEmote/create", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "itemsOwned customEmotes _id"
    );
    user = user.toJSON();

    const ownedCustomEmotes =
      user.itemsOwned.customEmotes + user.itemsOwned.customEmotesExtra;
    if (user.customEmotes.length >= ownedCustomEmotes) {
      res.status(500);
      res.send("You need to purchase more custom emotes from the shop.");
      return;
    }

    const maxOwnedCustomEmotes =
      constants.maxOwnedCustomEmotes + constants.maxOwnedCustomEmotesExtra;
    if (user.customEmotes.length >= maxOwnedCustomEmotes) {
      res.status(500);
      res.send(
        `You can only have up to ${maxOwnedCustomEmotes} custom emotes linked to your account.`
      );
      return;
    }

    var form = new formidable();
    form.maxFileSize = 2 * 1024 * 1024;
    form.maxFields = 1;

    var [fields, files] = await form.parseAsync(req);

    let customEmote = Object();
    customEmote.name = String(fields.emoteText || "");

    /* customEmote name checks
    - must be non-empty
    - must fit within the constraints for emotify
    - must not be too long
    - must be unique per player
    */
    if (!customEmote.name || !customEmote.name.length) {
      res.status(400);
      res.send("You must give your custom emote a name.");
      return;
    }

    if (customEmote.name.match(/( |:)/)) {
      res.status(400);
      res.send("Custom emote names may not have spaces or colons in them.");
      return;
    }

    if (customEmote.name.length > constants.maxCustomEmoteNameLength) {
      res.status(400);
      res.send("Emote name is too long.");
      return;
    }

    var existingCustomEmote = await models.CustomEmote.findOne({
      creator: new ObjectID(user._id),
      name: customEmote.name,
      deleted: false,
    }).select("-_id");
    if (existingCustomEmote) {
      res.status(400);
      res.send(`You already have a custom emote with that name.`);
      return;
    }

    customEmote.id = shortid.generate();
    customEmote.extension = "webp";
    customEmote.creator = req.session.user._id;

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}`))
      fs.mkdirSync(`${process.env.UPLOAD_PATH}`);

    // Convert the data in the file from an octet stream to its original raw bytes
    // https://stackoverflow.com/a/20272545
    const fileContents = fs.readFileSync(files.file.path).toString();
    const matches = fileContents.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (matches.length !== 3) {
      res.status(400);
      res.send("Invalid octet stream.");
      return;
    }

    const buffer = Buffer.from(matches[2], "base64");

    const image = sharp(buffer, { animated: true });
    image
      .metadata()
      .then(function (metadata) {
        if (metadata.width <= 30 && metadata.height <= 30) {
          // No resizing necessary, construct image.
          return sharp(buffer, { animated: true }).webp();
        } else {
          // Resizing necessary.
          return sharp(buffer, { animated: true }).webp().resize({
            width: 30,
            height: 30,
            fit: "inside",
            withoutEnlargement: true,
          });
        }
      })
      .then(function (webp) {
        // Save to disk
        webp.toFile(
          utils.getCustomEmoteFilepath(
            userId,
            customEmote.id,
            customEmote.extension
          )
        );
      });

    customEmote = new models.CustomEmote(customEmote);
    await customEmote.save();
    await models.User.updateOne(
      { id: userId },
      { $push: { customEmotes: customEmote._id } }
    ).exec();

    // Allow the new custom emote to be cached
    redis.invalidateCachedUser(userId);

    res.send(customEmote);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to make custom emote.");
  }
});

router.post("/customEmote/delete", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let customEmoteId = String(req.body.id);

    let customEmote = await models.CustomEmote.findOne({
      id: customEmoteId,
      deleted: false,
    })
      .select("_id id extension name creator")
      .populate([
        {
          path: "creator",
          model: "User",
          select: "id -_id",
        },
      ]);

    if (!customEmote || customEmote.creator.id != userId) {
      res.status(500);
      res.send("You can only delete custom emotes you have created.");
      return;
    }

    // not sure if user custom emotes should be removed or not in case it needs to be cited for an offense
    //fs.rmSync(utils.getCustomEmoteFilepath(userId, customEmote.id, customEmote.extension));

    await models.CustomEmote.updateOne(
      { id: customEmoteId },
      { $set: { deleted: true } }
    ).exec();
    await models.User.updateOne(
      { id: customEmote.creator.id },
      { $pull: { customEmotes: customEmote._id } }
    ).exec();

    // Allow the deleted custom emote to be uncached
    redis.invalidateCachedUser(userId);

    res.send(`Deleted custom emote ${customEmote.name}`);
    return;
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to delete custom emote.");
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

    if (prop == "avatarShape" && !itemsOwned.avatarShape) {
      res.status(500);
      res.send("You must purchase Square with coins from the Shop.");
      return;
    }

    if (prop == "iconFilter" && !itemsOwned.iconFilter) {
      res.status(500);
      res.send("You must purchase Icon Filter with coins from the Shop.");
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

    const propRequiresGoodContrast =
      prop === "textColor" || prop === "nameColor";
    if (propRequiresGoodContrast && !colorHasGoodContrastForBothThemes(value)) {
      return res
        .status(422)
        .end(
          "Color must have good contrast in both light and dark themes. Please choose a different color."
        );
    }

    let unsetOperator = {};
    if (prop === "textColor") {
      unsetOperator = { $unset: { "settings.warnTextColor": "" } };
    }
    if (prop === "nameColor") {
      unsetOperator = { $unset: { "settings.warnNameColor": "" } };
    }
    await models.User.updateOne(
      { id: userId },
      { $set: { [`settings.${prop}`]: value }, ...unsetOperator }
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

    if (bio.length < constants.maxBioContentLength) {
      await models.User.updateOne({ id: userId }, { $set: { bio: bio } });
      res.sendStatus(200);
    } else if (bio.length >= constants.maxBioContentLength) {
      res.status(500);
      res.send(
        `Bio must be less than ${constants.maxBioContentLength} characters`
      );
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

router.post("/pronouns", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var pronouns = String(req.body.pronouns);
    var perm = "editPronouns";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (pronouns.length < constants.maxPronounsContentLength) {
      await models.User.updateOne(
        { id: userId },
        { $set: { pronouns: pronouns } }
      );
      res.sendStatus(200);
    } else if (pronouns.length >= constants.maxPronounsContentLength) {
      res.status(500);
      res.send(
        `Pronouns must be less than ${constants.maxPronounsContentLength} characters`
      );
    } else {
      res.status(500);
      res.send("Error editing pronouns");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error editing pronouns");
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
      .webp()
      .resize({
        width: 900,
        height: 300,
        withoutEnlargement: true,
      })
      .toFile(`${process.env.UPLOAD_PATH}/${userId}_banner.webp`);
    await models.User.updateOne({ id: userId }, { $set: { banner: true } });

    res.sendStatus(200);
  } catch (e) {
    res.status(500);

    if (e.message.indexOf("maxFileSize exceeded") == 0)
      res.send("Image is too large, banner must be less than 1 MB");
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
      .webp()
      .resize(100, 100)
      .toFile(`${process.env.UPLOAD_PATH}/${userId}_avatar.webp`);
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

router.delete("/birthday", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let userId = await routeUtils.verifyLoggedIn(req);

    await models.User.updateOne(
      { id: userId },
      {
        $unset: { birthday: "" },
        $set: { bdayChanged: false },
      }
    ).exec();
    await redis.cacheUserInfo(userId, true);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing birthday.");
  }
});

router.post("/name", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var itemsOwned = await redis.getUserItemsOwned(userId);
    var name = String(req.body.name);
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

async function unlove(userId, userIdToLove) {
  await models.Love.deleteOne({ userId, loveId: userIdToLove }).exec();
  await models.Love.deleteOne({ userId: userIdToLove, loveId: userId }).exec();

  await models.User.updateMany(
    { id: { $in: [userId, userIdToLove] } },
    { love: "" }
  ).exec();

  await models.LoveRequest.deleteOne({ userId: userIdToLove }).exec();
  await models.LoveRequest.deleteOne({ userId: userId }).exec();

  return;
}

async function acceptLove(userId, userIdToLove, type, userName) {
  if (type === "Lover") {
    var love = new models.Love({
      userId: userId,
      loveId: userIdToLove,
      type: type,
    });
    await love.save();

    love = new models.Love({
      userId: userIdToLove,
      loveId: userId,
      type: type,
    });
    await love.save();

    await routeUtils.createNotification(
      {
        content: `${userName} accepted your love!`,
        icon: "fas fa-heart",
        link: `/user/${userId}`,
      },
      [userIdToLove]
    );
  }

  if (type === "Married") {
    await models.Love.updateOne(
      { userId: userIdToLove },
      { $set: { type: "Married" } }
    ).exec();
    await models.Love.updateOne(
      { userId: userId },
      { $set: { type: "Married" } }
    ).exec();

    await routeUtils.createNotification(
      {
        content: `${userName} accepted your marriage proposal!`,
        icon: "fas fa-ring",
        link: `/user/${userId}`,
      },
      [userIdToLove]
    );
  }

  await models.LoveRequest.deleteOne({ userId: userIdToLove }).exec();
  await models.LoveRequest.deleteOne({ userId: userId }).exec();

  await models.LoveRequest.deleteMany({
    $or: [{ userId: userId }, { loveId: userId }],
  }).exec();
}

router.post("/love", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userName = await redis.getUserName(userId);
    var userIdToLove = String(req.body.user);

    var currentLove = String(req.body.type);
    var requestType = String(req.body.reqType);

    if (userId === userIdToLove) {
      res.status(500);
      res.send({
        message: "Self love is good, but the site doesn't work that way.",
        love: null,
      });
      return;
    }

    // Does the user have an active love request sent to a different user already?
    // SHOULD PROBABLY TELL THE USER ON FRONT END THAT SENDING REQUEST WILL CANCEL THEIR OTHER REQUESTS INSTEAD.
    var otherUserRequest = await models.LoveRequest.findOne({
      userId: userId,
    }).select("targetId type -_id");

    if (otherUserRequest !== null) {
      otherUserRequest = otherUserRequest.toJSON();

      if (otherUserRequest.targetId !== userIdToLove) {
        await models.LoveRequest.deleteOne({
          userId,
          targetId: userIdToLove,
        }).exec();
      }
    }

    var existingRequest = await models.LoveRequest.findOne({
      userId,
      targetId: userIdToLove,
    }).select("type -_id");

    // Cancel existing request
    if (existingRequest) {
      var cancelMessage = "";
      if (existingRequest.toJSON().type === "Married") {
        cancelMessage = "Marriage proposal cancelled.";
      } else {
        cancelMessage = "Love request cancelled.";
      }
      await models.LoveRequest.deleteOne({
        userId,
        targetId: userIdToLove,
      }).exec();
      res.send({ message: cancelMessage, love: null });
      return;
    }

    var existingLove = await models.Love.findOne({
      userId,
      loveId: userIdToLove,
    }).select("type _id");

    if (
      currentLove === "Married" &&
      existingLove.toJSON().type === "Married" &&
      requestType === "Marry"
    ) {
      await unlove(userId, userIdToLove, "Married");
      res.send({ message: "Divorced this user.", love: {} });
      return;
    } else {
      // Unlove
      if (
        existingLove !== null &&
        existingLove.toJSON().type === "Lover" &&
        currentLove === "Lover" &&
        requestType === "Love"
      ) {
        await unlove(userId, userIdToLove, "Lover");
        res.send({ message: "Broke up with this user.", love: {} });
        return;
      }
    }

    existingRequest = await models.LoveRequest.findOne({
      userId: userIdToLove,
      targetId: userId,
    }).select("type _id");

    // Accept existing request
    if (existingRequest) {
      var requestType = existingRequest.toJSON().type;

      await acceptLove(userId, userIdToLove, requestType, userName);
      var love = await models.Love.findOne({ userId: userIdToLove }).select(
        "loveId type"
      );

      if (love) {
        love = love.toJSON();

        var userLove = await models.User.findOne({ id: love.loveId }).select(
          "id name avatar -_id"
        );

        userLove = userLove.toJSON();
        userLove.type = love.type;

        if (requestType === "Lover") {
          res.send({ message: "Love request accepted!", love: userLove });
        } else if (requestType === "Married") {
          res.send({ message: "Marriage proposal accepted!", love: userLove });
        }
        return;
      }
    }

    var createRequestType, notifContent, image, response, err;
    if (currentLove === "Lover") {
      createRequestType = "Married";
      notifContent = `${userName} proposed marriage to you!`;
      image = "fas fa-ring";
      response = "Marriage proposal sent!";
      err = "Error sending marriage proposal";
    } else {
      createRequestType = "Lover";
      notifContent = `${userName} sent a love request!`;
      image = "fas fa-heart";
      response = "Love request sent!";
      err = "Error sending love request";
    }

    // Create new request
    var request = new models.LoveRequest({
      userId: userId,
      targetId: userIdToLove,
      type: createRequestType,
    });
    await request.save();

    await routeUtils.createNotification(
      {
        content: notifContent,
        icon: image,
        link: `/user/${userId}`,
      },
      [userIdToLove]
    );

    res.send({ message: response, requestType: createRequestType });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send(err);
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
    await models.Love.deleteMany({ userId }).exec();
    await models.LoveRequest.deleteMany({
      $or: [{ userId: userId }, { loveId: userId }],
    }).exec();
    await models.DocSave.deleteMany({
      $or: [{ userIrd: userId }, { loveId: userId }],
    }).exec();
    await models.Friend.deleteMany({ userId }).exec();
    await models.FriendRequest.deleteMany({
      $or: [{ userId: userId }, { friendId: userId }],
    }).exec();
    await models.InGroup.deleteMany({ user: dbId }).exec();

    // Clear vanity URL so it can be claimed by other users
    await models.VanityUrl.deleteMany({ userId: userId }).exec();
    await models.User.updateOne(
      { id: userId },
      { $unset: { "settings.vanityUrl": "" } }
    ).exec();

    await models.User.updateOne(
      { id: userId },
      {
        $set: {
          lastActive: 0,
          deleted: true,
        },
        $unset: {
          fbUid: "",
          avatar: "",
          banner: "",
          bio: "",
          pronouns: "",
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
          achievements: "",
          dailyChallenges: "",
          dailyChallengesCompleted: "",
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

module.exports = router;
