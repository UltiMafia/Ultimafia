const bluebird = require("bluebird");
const redis = bluebird.promisifyAll(require("redis"));
const shortid = require("shortid");
const sha1 = require("sha1");
const models = require("../db/models");
const constants = require("../data/constants");
const Random = require("./../lib/Random");
const utils = require("../lib/Utils");

var client = redis.createClient({ url: "redis://redis:6379" });

client.on("error", (e) => {
  throw e;
});
client.select(process.env.REDIS_DB || 0);

async function getUserDbId(userId) {
  const key = `user:${userId}:dbId`;
  const exists = await client.existsAsync(key);

  if (!exists) {
    const user = await models.User.findOne({ id: userId }).select("_id");

    if (user) {
      client.set(key, user._id);
      client.expire(key, 3600);
    }

    return user._id;
  } else return await client.get(key);
}

async function cacheSetups(userId) {
  const key = `user:${userId}:favSetups`;
  const exists = await client.existsAsync(key);

  if (!exists) {
    var user = await models.User.findOne({ id: userId, deleted: false })
      .select("favSetups")
      .populate({
        path: "favSetups",
        select: "id",
      });

    if (!user) return;

    var setups = user.favSetups.map((setup) => setup.id);

    for (let setup of setups) client.sadd(key, setup);

    client.expire(key, 3600);
  }
}

async function getFavSetups(userId) {
  await cacheSetups(userId);
  const key = `user:${userId}:favSetups`;
  return await client.smembersAsync(key);
}

async function getFavSetupsHashtable(userId) {
  var setups = {};
  const setupList = await getFavSetups(userId);

  for (let setup of setupList) setups[setup] = true;

  return setups;
}

async function updateFavSetup(userId, setupId) {
  await cacheSetups(userId);

  const key = `user:${userId}:favSetups`;
  const isMember = await client.sismemberAsync(key, setupId);
  var setup = await models.Setup.findOne({ id: setupId });

  if (setup && isMember) {
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "_id"
    );

    if (!user) return "0";

    client.srem(key, setupId);
    models.User.updateOne(
      { id: userId },
      { $pull: { favSetups: setup._id } }
    ).exec();
    models.Setup.updateOne({ id: setupId }, { $inc: { favorites: -1 } }).exec();

    return "-1";
  } else if (setup) {
    var favSetupCount = await client.scardAsync(key);

    if (favSetupCount > constants.maxFavSetups) return "-2";

    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "_id"
    );

    if (!user) return "0";

    client.sadd(key, setupId);
    client.expire(key, 3600);
    models.User.updateOne(
      { id: userId },
      { $push: { favSetups: setup._id } }
    ).exec();
    models.Setup.updateOne({ id: setupId }, { $inc: { favorites: 1 } }).exec();

    return "1";
  } else return "0";
}

async function userCached(userId) {
  return client.existsAsync(`user:${userId}:info:id`);
}

async function invalidateCachedUser(userId) {
  client.del(`user:${userId}:info:id`);
}

async function cacheUserInfo(userId, reset) {
  var exists = await userCached(userId);

  if (!exists || reset) {
    const maxOwnedCustomEmotes =
      constants.maxOwnedCustomEmotes + constants.maxOwnedCustomEmotesExtra;

    var user = await models.User.findOne({ id: userId, deleted: false })
      .select(
        "_id id name avatar blockedUsers settings customEmotes itemsOwned nameChanged bdayChanged birthday pronouns achievements redHearts goldHearts dailyChallengesCompleted dailyChallenges"
      )
      .populate({
        path: "customEmotes",
        select: "id extension name -_id",
        options: { limit: maxOwnedCustomEmotes },
      });

    if (!user) return false;

    // Count the total games played - games are retained in this array even if they expire
    const aggregation = await models.User.aggregate([
      { $match: { _id: user._id } },
      { $project: { count: { $size: "$games" } } },
    ]);
    var gamesPlayed = 0;
    aggregation.forEach((match) => (gamesPlayed = match.count));

    // Get all of the user's heart refreshes
    let heartRefreshes = await models.HeartRefresh.find({
      userId: userId,
    }).select("when type");

    var redHeartRefreshTimestamp = 0;
    var goldHeartRefreshTimestamp = 0;

    for (let heartRefresh of heartRefreshes) {
      if (heartRefresh.type === "red")
        redHeartRefreshTimestamp = heartRefresh.when;
      else if (heartRefresh.type === "gold")
        goldHeartRefreshTimestamp = heartRefresh.when;
    }

    user = user.toJSON();
    utils.remapCustomEmotes(user, userId);

    await client.setAsync(`user:${userId}:info:id`, userId);
    await client.setAsync(`user:${userId}:info:name`, user.name);
    await client.setAsync(`user:${userId}:info:avatar`, user.avatar || false);
    await client.setAsync(`user:${userId}:info:nameChanged`, user.nameChanged);
    await client.setAsync(`user:${userId}:info:bdayChanged`, user.bdayChanged);
    await client.setAsync(`user:${userId}:info:birthday`, user.birthday || 0);
    await client.setAsync(`user:${userId}:info:pronouns`, user.pronouns);
    await client.setAsync(`user:${userId}:info:gamesPlayed`, gamesPlayed);
    await client.setAsync(`user:${userId}:info:redHearts`, user.redHearts);
    await client.setAsync(`user:${userId}:info:goldHearts`, user.goldHearts);
    await client.setAsync(
      `user:${userId}:info:redHeartRefreshTimestamp`,
      redHeartRefreshTimestamp
    );
    await client.setAsync(
      `user:${userId}:info:goldHeartRefreshTimestamp`,
      goldHeartRefreshTimestamp
    );
    await client.setAsync(
      `user:${userId}:info:dailyChallenges`,
      JSON.stringify(user.dailyChallenges || [])
    );
    await client.setAsync(
      `user:${userId}:info:blockedUsers`,
      JSON.stringify(user.blockedUsers || [])
    );
    await client.setAsync(
      `user:${userId}:info:settings`,
      JSON.stringify(user.settings)
    );
    await client.setAsync(
      `user:${userId}:info:itemsOwned`,
      JSON.stringify(user.itemsOwned)
    );

    var inGroups = await models.InGroup.find({ user: user._id }).populate(
      "group",
      "id name rank badge badgeColor -_id"
    );
    var groups = inGroups.map((inGroup) => inGroup.toJSON().group);
    await client.setAsync(`user:${userId}:info:groups`, JSON.stringify(groups));
  }

  client.expire(`user:${userId}:info:id`, 3600);
  client.expire(`user:${userId}:info:name`, 3600);
  client.expire(`user:${userId}:info:avatar`, 3600);
  client.expire(`user:${userId}:info:nameChanged`, 3600);
  client.expire(`user:${userId}:info:bdayChanged`, 3600);
  client.expire(`user:${userId}:info:birthday`, 3600);
  client.expire(`user:${userId}:info:pronouns`, 3600);
  client.expire(`user:${userId}:info:gamesPlayed`, 3600);
  client.expire(`user:${userId}:info:redHearts`, 3600);
  client.expire(`user:${userId}:info:goldHearts`, 3600);
  client.expire(`user:${userId}:info:redHeartRefreshTimestamp`, 3600);
  client.expire(`user:${userId}:info:goldHeartRefreshTimestamp`, 3600);
  client.expire(`user:${userId}:info:dailyChallenges`, 3600);
  client.expire(`user:${userId}:info:blockedUsers`, 3600);
  client.expire(`user:${userId}:info:settings`, 3600);
  client.expire(`user:${userId}:info:itemsOwned`, 3600);
  client.expire(`user:${userId}:info:groups`, 3600);

  return true;
}

async function deleteUserInfo(userId) {
  await client.delAsync(`user:${userId}:info:id`);
  await client.delAsync(`user:${userId}:info:name`);
  await client.delAsync(`user:${userId}:info:avatar`);
  await client.delAsync(`user:${userId}:info:nameChanged`);
  await client.delAsync(`user:${userId}:info:bdayChanged`);
  await client.delAsync(`user:${userId}:info:birthday`);
  await client.delAsync(`user:${userId}:info:pronouns`);
  await client.delAsync(`user:${userId}:info:gamesPlayed`);
  await client.delAsync(`user:${userId}:info:redHearts`);
  await client.delAsync(`user:${userId}:info:goldHearts`);
  await client.delAsync(`user:${userId}:info:redHeartRefreshTimestamp`);
  await client.delAsync(`user:${userId}:info:goldHeartRefreshTimestamp`);
  await client.delAsync(`user:${userId}:info:dailyChallenges`);
  await client.delAsync(`user:${userId}:info:status`);
  await client.delAsync(`user:${userId}:info:blockedUsers`);
  await client.delAsync(`user:${userId}:info:settings`);
  await client.delAsync(`user:${userId}:info:itemsOwned`);
  await client.delAsync(`user:${userId}:info:groups`);
}

async function getUserInfo(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var info = {};
  info.id = await client.getAsync(`user:${userId}:info:id`);
  info.name = await client.getAsync(`user:${userId}:info:name`);
  info.avatar = (await client.getAsync(`user:${userId}:info:avatar`)) == "true";
  info.nameChanged =
    (await client.getAsync(`user:${userId}:info:nameChanged`)) == "true";
  info.bdayChanged =
    (await client.getAsync(`user:${userId}:info:bdayChanged`)) == "true";
  info.birthday = await client.getAsync(`user:${userId}:info:birthday`);
  info.pronouns = await client.getAsync(`user:${userId}:info:pronouns`);
  info.gamesPlayed = await client.getAsync(`user:${userId}:info:gamesPlayed`);
  info.redHearts = await client.getAsync(`user:${userId}:info:redHearts`);
  info.goldHearts = await client.getAsync(`user:${userId}:info:goldHearts`);
  info.redHeartRefreshTimestamp = await client.getAsync(
    `user:${userId}:info:redHeartRefreshTimestamp`
  );
  info.goldHeartRefreshTimestamp = await client.getAsync(
    `user:${userId}:info:goldHeartRefreshTimestamp`
  );
  info.dailyChallenges = JSON.parse(
    await client.getAsync(`user:${userId}:info:dailyChallenges`)
  );
  info.status = await client.getAsync(`user:${userId}:info:status`);
  info.blockedUsers = JSON.parse(
    await client.getAsync(`user:${userId}:info:blockedUsers`)
  );
  info.settings = JSON.parse(
    await client.getAsync(`user:${userId}:info:settings`)
  );
  info.itemsOwned = JSON.parse(
    await client.getAsync(`user:${userId}:info:itemsOwned`)
  );
  info.groups = JSON.parse(await client.getAsync(`user:${userId}:info:groups`));
  info.achievements = await client.getAsync(`user:${userId}:info:achievements`);

  return info;
}

async function getBasicUserInfo(userId, delTemplate) {
  var exists = await cacheUserInfo(userId);

  if (!exists && !delTemplate) return;
  else if (!exists && delTemplate) {
    return {
      id: userId,
      name: "[deleted]",
      avatar: false,
      status: "offline",
      groups: [],
      settings: {},
    };
  }

  var info = {};
  info.id = await client.getAsync(`user:${userId}:info:id`);
  info.name = await client.getAsync(`user:${userId}:info:name`);
  info.avatar = (await client.getAsync(`user:${userId}:info:avatar`)) == "true";
  info.status = await client.getAsync(`user:${userId}:info:status`);
  info.groups = JSON.parse(await client.getAsync(`user:${userId}:info:groups`));

  var settings = JSON.parse(
    await client.getAsync(`user:${userId}:info:settings`)
  );
  info.settings = {
    nameColor: settings?.nameColor,
    textColor: settings?.textColor,
  };

  return info;
}

async function getUserName(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  return await client.getAsync(`user:${userId}:info:name`);
}

async function getUserStatus(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var status = await client.getAsync(`user:${userId}:info:status`);
  return status || "offline";
}

async function getBlockedUsers(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var blockedUsers = await client.getAsync(`user:${userId}:info:blockedUsers`);
  return JSON.parse(blockedUsers || "[]");
}

async function getUserSettings(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var settings = await client.getAsync(`user:${userId}:info:settings`);
  return JSON.parse(settings || "{}");
}

async function getUserItemsOwned(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var settings = await client.getAsync(`user:${userId}:info:itemsOwned`);
  return JSON.parse(settings || "{}");
}

async function createAuthToken(userId) {
  const token = sha1(Random.randFloat());
  const key = `token:${token}`;

  await client.setAsync(key, userId);
  client.expire(key, 5);

  return token;
}

async function authenticateToken(token) {
  const key = `token:${token}`;
  const userId = await client.getAsync(key);
  return userId;
}

async function getLeaderBoardStat(field) {
  const key = `leaderboard:${field}`;

  const cachedLeaderboard = await client.getAsync(key);
  if (cachedLeaderboard) {
    // Got cached result, no need to perform query
    return JSON.parse(cachedLeaderboard);
  } else {
    var sortBy = {};
    sortBy[field] = -1;

    // Query the top 100 users for a given field
    const leadingUsers = await models.User.find({ deleted: false })
      .select(
        "id name avatar kudos karma achievementCount winRate dailyChallengesCompleted _id"
      )
      .sort(sortBy)
      .limit(100);

    // Cache the result in redis so that we don't have to do the query again for a little bit
    await client.setAsync(key, JSON.stringify(leadingUsers));

    // Causes leaderboards update every 2 minutes
    client.expire(key, 120);

    return leadingUsers;
  }
}

/*
 * Gets the setup that appears in the ez-host feature.
 * - New players should retrieve the classic setup
 * - Everyone one else gets an hourly rotating setup from the featured setups
 *
 * @param featuredCategory either "classic", "main", or "minigames"
 */
async function getFeaturedSetup(featuredCategory) {
  const key = `game:featuredSetup:${featuredCategory}`;

  var setup = await client.getAsync(key);
  if (setup) {
    // Got cached result, no need to perform query
    return JSON.parse(setup);
  } else {
    if (featuredCategory === "classic") {
      // If the featuredCategory is classic, then we need to find *the* classic setup in the database
      setup = await models.Setup.findOne({
        // case sensitive, name is included in search for performance since it's indexed
        name: "Classic",

        // A bit hacky but the roles are alphabetically sorted so hey it works
        roles: '[{"Cop:":1,"Doctor:":1,"Villager:":3,"Mafioso:":2}]',

        // ranked: true should prevent stale classic setups from being searched
        ranked: true,
      }).select(
        "id gameType name roles closed useRoleGroups roleGroupSizes count total -_id"
      );
    } else {
      let filter = {
        featured: true,
      };

      // I would ideally like to incorporate setup tags into this one day so that tags can help separate featured setups for different lobbies
      // For now, only minigames is separated
      if (featuredCategory === "minigames") {
        filter.gameType = { $ne: "Mafia" };
      } else {
        filter.gameType = "Mafia";
      }

      var setups = await models.Setup.find(filter)
        .sort({ _id: -1 })
        .limit(100)
        .select(
          "id gameType name roles closed useRoleGroups roleGroupSizes count total featured -_id"
        )
        .populate("creator", "id name avatar tag -_id");

      const hoursSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60));
      const index = hoursSinceEpoch % setups.length;

      setup = setups[index];
    }

    if (!setup) {
      return null;
    }

    // Cache the result in redis so that we don't have to do the query again for a little bit
    await client.setAsync(key, JSON.stringify(setup));

    // Allow cache to expire every ten minutes (an hour expiration could cause setups to be skipped)
    client.expire(key, 600);

    return setup;
  }
}

async function gameExists(gameId) {
  return (await client.sismemberAsync("games", gameId)) != 0;
}

async function inGame(userId) {
  const gameId = await client.getAsync(`user:${userId}:game`);
  return gameId || false;
}

async function hostingScheduled(userId) {
  const gameId = await client.getAsync(`user:${userId}:scheduled`);
  return gameId || false;
}

async function getCreatingGame(userId) {
  const val = await client.getAsync(`creatingGame:${userId}`);
  return val != null && val != 0;
}

async function getSetCreatingGame(userId) {
  const key = `creatingGame:${userId}`;
  const newVal = await client.incrAsync(key);
  client.expire(key, Number(process.env.GAME_CREATION_TIMEOUT) / 1000 + 1);
  return newVal - 1 != 0;
}

async function unsetCreatingGame(userId) {
  const key = `creatingGame:${userId}`;
  const newVal = await client.decrAsync(key);

  if (newVal <= 0) await client.delAsync(key);
}

async function setHostingScheduled(userId, gameId) {
  if (hostingScheduled(userId)) return;

  await client.setAsync(`user:${userId}:scheduled`, gameId);
}

async function clearHostingScheduled(userId) {
  await client.delAsync(`user:${userId}:scheduled`);
}

async function getGameInfo(gameId, idsOnly) {
  if (!(await gameExists(gameId))) return;

  var info = {};

  info.id = gameId;
  info.type = await client.getAsync(`game:${gameId}:type`);
  info.port = await client.getAsync(`game:${gameId}:port`);
  info.status = await client.getAsync(`game:${gameId}:status`);
  info.hostId = await client.getAsync(`game:${gameId}:hostId`);
  info.lobby = await client.getAsync(`game:${gameId}:lobby`);
  info.spectatorCount = await client.getAsync(`game:${gameId}:spectatorCount`);
  info.gameState = await client.getAsync(`game:${gameId}:gameState`);
  info.winnersInfo = JSON.parse(await client.getAsync(`game:${gameId}:winnersInfo`) || "{}");
  info.lobbyName = await client.getAsync(`game:${gameId}:lobbyName`);
  info.settings = JSON.parse(
    (await client.getAsync(`game:${gameId}:settings`)) || "{}"
  );
  info.createTime = Number(await client.getAsync(`game:${gameId}:createTime`));
  info.startTime = Number(await client.getAsync(`game:${gameId}:startTime`));
  info.webhookPublished = await client.existsAsync(
    `game:${gameId}:webhookPublished`
  );
  info.setup = info.settings.setup;

  if (!info.settings.scheduled || info.settings.scheduled < Date.now())
    info.players = (await client.smembersAsync(`game:${gameId}:players`)) || [];
  else info.players = await getGameReservations(gameId);

  if (!idsOnly) {
    var newPlayers = [];

    for (let playerId of info.players) {
      let userInfo = await getBasicUserInfo(playerId);

      if (userInfo) newPlayers.push(userInfo);
      else {
        newPlayers.push({
          name: "[Guest]",
          id: "",
          avatar: false,
        });
      }
    }

    info.players = newPlayers;
  }

  return info;
}

async function getPlayerGameInfo(playerId) {
  const gameId = await inGame(playerId);
  return await getGameInfo(gameId);
}

async function getGamePort(gameId) {
  return await client.getAsync(`game:${gameId}:port`);
}

async function getGameType(gameId) {
  return await client.getAsync(`game:${gameId}:type`);
}

async function getGameReservations(gameId, start, stop) {
  start = start != null ? start : 0;
  stop = stop != null ? stop : -1;
  return await client.zrangeAsync(`game:${gameId}:reservations`, start, stop);
}

async function setGameStatus(gameId, status) {
  await client.setAsync(`game:${gameId}:status`, status);

  if (status == "In Progress")
    await client.setAsync(`game:${gameId}:startTime`, Date.now());
}

async function setGameSetup(gameId, setupID) {
  let info = JSON.parse(
    (await client.getAsync(`game:${gameId}:settings`)) || "{}"
  );
  info.setup = setupID;
  //JSON.stringify(info);
  await client.setAsync(`game:${gameId}:settings`, JSON.stringify(info));
}

async function getOpenGames(gameType) {
  var allGames = await client.smembersAsync("games");
  var games = [];

  for (let gameId of allGames) {
    let game = await getGameInfo(gameId);

    if (game && (!gameType || game.type == gameType) && game.status == "Open") {
      games.push(game);
    }
  }

  return games;
}

async function getOpenPublicGames(gameType) {
  var allGames = await client.smembersAsync("games");
  var games = [];

  for (let gameId of allGames) {
    let game = await getGameInfo(gameId);

    if (
      game &&
      (!gameType || game.type == gameType) &&
      game.status == "Open" &&
      !game.settings.private
    ) {
      games.push(game);
    }
  }

  return games;
}

async function getInProgressGames(gameType) {
  var allGames = await client.smembersAsync("games");
  var games = [];

  for (let gameId of allGames) {
    let game = await getGameInfo(gameId);

    if (
      game &&
      (!gameType || game.type == gameType) &&
      game.status == "In Progress"
    ) {
      games.push(game);
    }
  }

  return games;
}

async function getInProgressPublicGames(gameType) {
  var allGames = await client.smembersAsync("games");
  var games = [];

  for (let gameId of allGames) {
    let game = await getGameInfo(gameId);

    if (
      game &&
      (!gameType || game.type == gameType) &&
      game.status == "In Progress" &&
      !game.settings.private
    ) {
      games.push(game);
    }
  }

  return games;
}

async function getAllGames(gameType) {
  var allGames = await client.smembersAsync("games");
  var games = [];

  for (let gameId of allGames) {
    let game = await getGameInfo(gameId);

    if (game && (!gameType || game.type == gameType)) games.push(game);
  }

  return games;
}

async function createGame(gameId, info) {
  for (let key in info) {
    let val = info[key];

    if (val == null) continue;

    if (typeof val == "object") val = JSON.stringify(val);

    await client.setAsync(`game:${gameId}:${key}`, val);
  }

  await client.setAsync(`game:${gameId}:spectatorCount`, 0);
  await client.setAsync(`game:${gameId}:gameState`, "Pregame");
  await client.setAsync(`game:${gameId}:winnersInfo`, "[]");

  await client.saddAsync("games", gameId);

  if (info.settings.scheduled) {
    await client.saddAsync("scheduledGames", gameId);
    await client.zaddAsync(
      `game:${gameId}:reservations`,
      Date.now(),
      info.hostId
    );
  }
}

async function joinGame(userId, gameId, ranked, competitive) {
  const currentGame = await client.getAsync(`user:${userId}:game`);

  if (currentGame == gameId) return;
  else if (currentGame != null) await leaveGame(userId);

  await client.saddAsync(`game:${gameId}:players`, userId);
  await client.setAsync(`user:${userId}:game`, gameId);

  if (ranked) {
    var ban = new models.Ban({
      id: shortid.generate(),
      userId,
      modId: null,
      expires: 0,
      permissions: [
        "createThread",
        "postReply",
        "editPost",
        "publicChat",
        "privateChat",
      ],
      type: "gameAuto",
      auto: true,
    });
    await ban.save();
  }

  if (competitive) {
    var ban = new models.Ban({
      id: shortid.generate(),
      userId,
      modId: null,
      expires: 0,
      permissions: [
        "createThread",
        "postReply",
        "editPost",
        "publicChat",
        "privateChat",
      ],
      type: "gameAuto",
      auto: true,
    });
    await ban.save();
  }
  await cacheUserPermissions(userId);
}

async function leaveGame(userId) {
  const gameId = await client.getAsync(`user:${userId}:game`);

  if (gameId) {
    await client.delAsync(`user:${userId}:game`);
    await client.sremAsync(`game:${gameId}:players`, userId);
  }

  await models.Ban.deleteMany({ userId, type: "gameAuto" }).exec();
  await cacheUserPermissions(userId);
}

async function reserveGame(userId, gameId) {
  var game = await getGameInfo(gameId);

  if (!game || !game.settings.scheduled) return;

  var key = `game:${gameId}:reservations`;
  var numReservations = await client.zcardAsync(key);
  await client.zaddAsync(key, Date.now(), userId);

  return numReservations < game.settings.total;
}

async function unreserveGame(userId, gameId) {
  if (!(await gameExists(gameId))) return;

  await client.zremAsync(`game:${gameId}:reservations`, userId);
}

async function deleteGame(gameId, game) {
  if (!(await gameExists(gameId))) return;

  game = game || (await getGameInfo(gameId, true));

  for (let playerId of game.players) await leaveGame(playerId);

  if (game.settings.scheduled) {
    await client.sremAsync("scheduledGames", gameId);

    if ((await client.getAsync(`user:${game.hostId}:scheduled`)) == game.id)
      await client.delAsync(`user:${game.hostId}:scheduled`);
  }

  await client.sremAsync("games", gameId);
  await client.delAsync(`game:${gameId}:id`);
  await client.delAsync(`game:${gameId}:type`);
  await client.delAsync(`game:${gameId}:port`);
  await client.delAsync(`game:${gameId}:status`);
  await client.delAsync(`game:${gameId}:hostId`);
  await client.delAsync(`game:${gameId}:lobby`);
  await client.delAsync(`game:${gameId}:spectatorCount`);
  await client.delAsync(`game:${gameId}:gameState`);
  await client.delAsync(`game:${gameId}:winnersInfo`);
  await client.delAsync(`game:${gameId}:lobbyName`);
  await client.delAsync(`game:${gameId}:players`);
  await client.delAsync(`game:${gameId}:settings`);
  await client.delAsync(`game:${gameId}:createTime`);
  await client.delAsync(`game:${gameId}:startTime`);
  await client.delAsync(`game:${gameId}:webhookPublished`);
}

async function breakGame(gameId) {
  if (!(await gameExists(gameId))) return;

  var game = await getGameInfo(gameId, true);
  await deleteGame(gameId);

  var setup = await models.Setup.findOne({ id: game.settings.setup });

  if (!setup) return;

  var setupId = setup._id;
  var users = [];

  for (let userId of game.players) {
    let user = await models.User.findOne({ id: userId }).select("_id");

    if (user) users.push(user._id);
  }

  game = new models.Game({
    id: game.id,
    type: game.type,
    setup: setupId,
    users: users,
    startTime: game.startTime,
    endTime: Date.now(),
    lobbyName: game.settings.lobbyName,
    ranked: game.settings.ranked,
    competitive: game.settings.competitive,
    private: game.settings.private,
    guests: game.settings.guests,
    spectating: game.settings.spectating,
    readyCheck: game.settings.readyCheck,
    noVeg: game.settings.noVeg,
    stateLengths: game.settings.stateLengths,
    gameTypeOptions: JSON.stringify(game.settings.gameTypeOptions),
    broken: true,
  });
  await game.save();
}

async function setSpectatorCount(gameId, spectatorCount) {
  await client.setAsync(`game:${gameId}:spectatorCount`, spectatorCount);
}

async function setGameState(gameId, gameState) {
  await client.setAsync(`game:${gameId}:gameState`, gameState);
}

async function setWinnersInfo(gameId, winnersInfo) {
  await client.setAsync(`game:${gameId}:winnersInfo`, JSON.stringify(winnersInfo));
}

async function gameWebhookPublished(gameId) {
  await client.setAsync(`game:${gameId}:webhookPublished`, "1");
}

async function registerGameServer(port) {
  await client.saddAsync("gameServers", port);
}

async function removeGameServer(port) {
  await client.sremAsync("gameServers", port);
}

async function getNextGameServerPort() {
  var ports = await client.smembersAsync("gameServers");
  var index = await client.incrAsync("gameServerIndex");

  index = Math.abs(index % ports.length);

  if (index === NaN || index === undefined || index === null) {
    index = 0;
  }

  return Number(ports[index]);
}

async function getAllGameServerPorts() {
  var ports = await client.smembersAsync("gameServers");
  return ports.map((port) => Number(port));
}

async function getOnlineUsers(limit) {
  var limit = limit || Infinity;
  var users = await client.zrangebyscoreAsync(
    "onlineUsers",
    Date.now() - constants.userOnlineTTL,
    Infinity
  );
  return users.slice(0, limit);
}

async function getOnlineUsersInfo(limit) {
  var userIds = await getOnlineUsers(limit);
  var users = [];

  for (let userId of userIds) {
    let user = await getBasicUserInfo(userId);

    if (user != null) users.push(user);
  }

  return users;
}

async function updateUserOnline(userId) {
  await client.zaddAsync("onlineUsers", Date.now(), userId);
  await client.setAsync(`user:${userId}:info:status`, "online");
  client.expire(`user:${userId}:info:status`, constants.userOnlineTTL / 1000);
}

async function setUserOffline(userId) {
  await client.zremAsync("onlineUsers", userId);
}

async function removeStaleUsers() {
  await client.zremrangebyscoreAsync(
    "onlineUsers",
    0,
    Date.now() - constants.userOnlineTTL
  );
}

async function getAllLastActive() {
  var dates = {};
  var users = await client.zrangeAsync("onlineUsers", 0, -1);

  for (let user of users)
    dates[user] = await client.zscoreAsync("onlineUsers", user);

  return dates;
}

async function cacheUserPermissions(userId) {
  const permKey = `user:${userId}:perms`;
  const rankKey = `user:${userId}:rank`;

  var user = await models.User.findOne({ id: userId, deleted: false }).select(
    "rank permissions"
  );

  if (!user) return { perms: {}, rank: 0, noUser: true };

  user = user.toJSON();

  var inGroups = await models.InGroup.find({ user: user._id }).populate(
    "group",
    "rank permissions"
  );
  var groups = inGroups.map((inGroup) => inGroup.toJSON().group);

  var bans = await models.Ban.find({ userId: userId }).select("permissions");

  var perms = {};
  var maxRank = user.rank || 0;

  for (let perm of constants.defaultPerms) perms[perm] = true;

  for (let perm of user.permissions) perms[perm] = true;

  for (let group of groups) {
    for (let perm of group.permissions) perms[perm] = true;

    if (group.rank > maxRank) maxRank = group.rank;
  }

  for (let ban of bans) for (let perm of ban.permissions) delete perms[perm];

  client.set(permKey, JSON.stringify(perms));
  client.expire(permKey, 3600);

  client.set(rankKey, maxRank);
  client.expire(rankKey, 3600);

  return { perms, rank: maxRank };
}

async function getUserPermissions(userId) {
  const permKey = `user:${userId}:perms`;
  const rankKey = `user:${userId}:rank`;
  const exists =
    (await client.existsAsync(permKey)) && (await client.existsAsync(rankKey));

  if (!exists) return await cacheUserPermissions(userId);
  else {
    const perms = await client.getAsync(permKey);
    const rank = await client.getAsync(rankKey);

    client.expire(permKey, 3600);
    client.expire(rankKey, 3600);

    return {
      perms: JSON.parse(perms),
      rank: Number(rank),
    };
  }
}

async function getUserRank(userId) {
  var perms = await getUserPermissions(userId);
  return !perms.noUser ? perms.rank : null;
}

async function hasPermissions(userId, perms, rank) {
  if (!userId) return false;

  const permInfo = await getUserPermissions(userId);

  if (permInfo.rank < rank) return false;

  for (let perm of perms)
    if (perm != null && permInfo.perms[perm] == null) return false;

  return true;
}

async function hasPermission(userId, perm, rank) {
  return await hasPermissions(userId, [perm], rank);
}

async function clearPermissionCache() {
  var keys = await client.keysAsync("user:*:perms");

  for (let key of keys) await client.delAsync(key);
}

async function rateLimit(userId, type) {
  var key = `user:${userId}:rateLimit:${type}`;
  var exists = await client.existsAsync(key);

  if (!exists) {
    await client.setAsync(key, 1);
    await client.pexpireAsync(key, constants.rateLimits[type] || 0);
  }

  return !exists;
}

module.exports = {
  client,
  getUserDbId,
  cacheSetups,
  getFavSetups,
  getFavSetupsHashtable,
  updateFavSetup,
  userCached,
  invalidateCachedUser,
  cacheUserInfo,
  deleteUserInfo,
  getUserInfo,
  getBasicUserInfo,
  getUserName,
  getUserStatus,
  getBlockedUsers,
  getUserSettings,
  getUserItemsOwned,
  createAuthToken,
  authenticateToken,
  getLeaderBoardStat,
  getFeaturedSetup,
  gameExists,
  inGame,
  hostingScheduled,
  getCreatingGame,
  getSetCreatingGame,
  unsetCreatingGame,
  setHostingScheduled,
  clearHostingScheduled,
  getGameInfo,
  getPlayerGameInfo,
  getGamePort,
  getGameType,
  getGameReservations,
  setGameStatus,
  setGameSetup,
  getOpenGames,
  getOpenPublicGames,
  getInProgressGames,
  getInProgressPublicGames,
  getAllGames,
  createGame,
  joinGame,
  leaveGame,
  reserveGame,
  unreserveGame,
  deleteGame,
  breakGame,
  setSpectatorCount,
  setGameState,
  setWinnersInfo,
  gameWebhookPublished,
  registerGameServer,
  removeGameServer,
  getNextGameServerPort,
  getAllGameServerPorts,
  getOnlineUsers,
  getOnlineUsersInfo,
  updateUserOnline,
  setUserOffline,
  removeStaleUsers,
  getAllLastActive,
  cacheUserPermissions,
  getUserPermissions,
  getUserRank,
  hasPermissions,
  hasPermission,
  clearPermissionCache,
  rateLimit,
};
