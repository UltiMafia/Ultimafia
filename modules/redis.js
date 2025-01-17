const bluebird = require("bluebird");
const redis = bluebird.promisifyAll(require("redis"));
const { nanoid } = require("nanoid");
const sha1 = require("sha1");
const models = require("../db/models");
const constants = require("../data/constants");
const Random = require("./../lib/Random");

let client = null;
if (process.env.NODE_ENV === "development_docker") {
  client = redis.createClient({ url: "redis://redis:6379" });
} else {
  client = redis.createClient();
}

client.on("error", (e) => {
  throw e;
});

client.connect();
client.select(process.env.REDIS_DB || 0);

async function getUserDbId(userId) {
  const key = `user:${userId}:dbId`;
  const exists = await client.exists(key);

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
  const exists = await client.exists(key);

  if (!exists) {
    var user = await models.User.findOne({ id: userId, deleted: false })
      .select("favSetups")
      .populate({
        path: "favSetups",
        select: "id",
      });

    if (!user) return;

    var setups = user.favSetups.map((setup) => setup.id);

    for (let setup of setups) client.sAdd(key, setup);

    client.expire(key, 3600);
  }
}

async function getFavSetups(userId) {
  await cacheSetups(userId);
  const key = `user:${userId}:favSetups`;
  return await client.sMembers(key);
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
  const isMember = await client.sIsMember(key, setupId);
  var setup = await models.Setup.findOne({ id: setupId });

  if (setup && isMember) {
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "_id"
    );

    if (!user) return "0";

    client.sRem(key, setupId);
    models.User.updateOne(
      { id: userId },
      { $pull: { favSetups: setup._id } }
    ).exec();
    models.Setup.updateOne({ id: setupId }, { $inc: { favorites: -1 } }).exec();

    return "-1";
  } else if (setup) {
    var favSetupCount = await client.sCard(key);

    if (favSetupCount > constants.maxFavSetups) return "-2";

    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "_id"
    );

    if (!user) return "0";

    client.sAdd(key, setupId);
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
  return client.exists(`user:${userId}:info:id`);
}

async function cacheUserInfo(userId, reset) {
  var exists = await userCached(userId);

  if (!exists || reset) {
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "id name avatar blockedUsers settings itemsOwned nameChanged bdayChanged birthday"
    );

    if (!user) return false;

    user = user.toJSON();

    // TODO [fix]:  node_redis: Deprecated: The SET command contains a "undefined" argument.
    //              This is converted to a "undefined" string now and will return an error from v.3.0 on.
    //              Please handle this in your code to make sure everything works as you intended it to.
    await client.set(`user:${userId}:info:id`, userId);
    await client.set(`user:${userId}:info:name`, user.name);
    await client.set(`user:${userId}:info:avatar`, JSON.stringify(user.avatar ?? "undefined"));
    await client.set(`user:${userId}:info:nameChanged`, JSON.stringify(user.nameChanged));
    await client.set(`user:${userId}:info:bdayChanged`, JSON.stringify(user.bdayChanged));
    await client.set(`user:${userId}:info:birthday`, user.birthday ?? "undefined");
    await client.set(
      `user:${userId}:info:blockedUsers`,
      JSON.stringify(user.blockedUsers || [])
    );
    await client.set(
      `user:${userId}:info:settings`,
      JSON.stringify(user.settings)
    );
    await client.set(
      `user:${userId}:info:itemsOwned`,
      JSON.stringify(user.itemsOwned)
    );

    var inGroups = await models.InGroup.find({ user: user._id }).populate(
      "group",
      "id name rank badge badgeColor -_id"
    );
    var groups = inGroups.map((inGroup) => inGroup.toJSON().group);
    await client.set(`user:${userId}:info:groups`, JSON.stringify(groups));
  }

  client.expire(`user:${userId}:info:id`, 3600);
  client.expire(`user:${userId}:info:name`, 3600);
  client.expire(`user:${userId}:info:avatar`, 3600);
  client.expire(`user:${userId}:info:nameChanged`, 3600);
  client.expire(`user:${userId}:info:bdayChanged`, 3600);
  client.expire(`user:${userId}:info:birthday`, 3600);
  client.expire(`user:${userId}:info:blockedUsers`, 3600);
  client.expire(`user:${userId}:info:settings`, 3600);
  client.expire(`user:${userId}:info:itemsOwned`, 3600);
  client.expire(`user:${userId}:info:groups`, 3600);

  return true;
}

async function deleteUserInfo(userId) {
  await client.del(`user:${userId}:info:id`);
  await client.del(`user:${userId}:info:name`);
  await client.del(`user:${userId}:info:avatar`);
  await client.del(`user:${userId}:info:nameChanged`);
  await client.del(`user:${userId}:info:bdayChanged`);
  await client.del(`user:${userId}:info:birthday`);
  await client.del(`user:${userId}:info:status`);
  await client.del(`user:${userId}:info:blockedUsers`);
  await client.del(`user:${userId}:info:settings`);
  await client.del(`user:${userId}:info:itemsOwned`);
  await client.del(`user:${userId}:info:groups`);
}

async function getUserInfo(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var info = {};
  const block = await client.get(`user:${userId}:info:blockedUsers`);
  info.id = await client.get(`user:${userId}:info:id`);
  info.name = await client.get(`user:${userId}:info:name`);
  info.avatar = (await client.get(`user:${userId}:info:avatar`)) == "true";
  info.nameChanged =
    (await client.get(`user:${userId}:info:nameChanged`)) == "true";
  info.bdayChanged =
    (await client.get(`user:${userId}:info:bdayChanged`)) == "true";
  info.birthday = await client.get(`user:${userId}:info:birthday`);
  info.status = await client.get(`user:${userId}:info:status`);
  info.blockedUsers = JSON.parse(
    await client.get(`user:${userId}:info:blockedUsers`)
  );
  info.settings = JSON.parse(
    await client.get(`user:${userId}:info:settings`)
  );
  info.itemsOwned = JSON.parse(
    await client.get(`user:${userId}:info:itemsOwned`)
  );
  info.groups = JSON.parse(await client.get(`user:${userId}:info:groups`));
  info.redHearts = await client.get(`user:${userId}:info:redHearts`);
  info.heartReset = await client.get(`user:${userId}:info:heartReset`);

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
  info.id = await client.get(`user:${userId}:info:id`);
  info.name = await client.get(`user:${userId}:info:name`);
  info.avatar = (await client.get(`user:${userId}:info:avatar`)) == "true";
  info.status = await client.get(`user:${userId}:info:status`);
  info.groups = JSON.parse(await client.get(`user:${userId}:info:groups`));

  var settings = JSON.parse(
    await client.get(`user:${userId}:info:settings`)
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

  return await client.get(`user:${userId}:info:name`);
}

async function getUserStatus(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var status = await client.get(`user:${userId}:info:status`);
  return status || "offline";
}

async function getBlockedUsers(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var blockedUsers = await client.get(`user:${userId}:info:blockedUsers`);
  return JSON.parse(blockedUsers || "[]");
}

async function getUserSettings(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var settings = await client.get(`user:${userId}:info:settings`);
  return JSON.parse(settings || "{}");
}

async function getUserItemsOwned(userId) {
  var exists = await cacheUserInfo(userId);

  if (!exists) return;

  var settings = await client.get(`user:${userId}:info:itemsOwned`);
  return JSON.parse(settings || "{}");
}

async function createAuthToken(userId) {
  const token = sha1(Random.randFloat());
  const key = `token:${token}`;

  await client.set(key, userId);
  client.expire(key, 5);

  return token;
}

async function authenticateToken(token) {
  const key = `token:${token}`;
  const userId = await client.get(key);
  return userId;
}

async function gameExists(gameId) {
  return (await client.sIsMember("games", gameId)) != 0;
}

async function inGame(userId) {
  const gameId = await client.get(`user:${userId}:game`);
  return gameId || false;
}

async function hostingScheduled(userId) {
  const gameId = await client.get(`user:${userId}:scheduled`);
  return gameId || false;
}

async function getCreatingGame(userId) {
  const val = await client.get(`creatingGame:${userId}`);
  return val != null && val != 0;
}

async function getSetCreatingGame(userId) {
  const key = `creatingGame:${userId}`;
  const newVal = await client.incr(key);
  client.expire(key, Number(process.env.GAME_CREATION_TIMEOUT) / 1000 + 1);
  return newVal - 1 != 0;
}

async function unsetCreatingGame(userId) {
  const key = `creatingGame:${userId}`;
  const newVal = await client.decr(key);

  if (newVal <= 0) await client.del(key);
}

async function setHostingScheduled(userId, gameId) {
  if (hostingScheduled(userId)) return;

  await client.set(`user:${userId}:scheduled`, gameId);
}

async function clearHostingScheduled(userId) {
  await client.del(`user:${userId}:scheduled`);
}

async function getGameInfo(gameId, idsOnly) {
  if (!(await gameExists(gameId))) return;

  var info = {};

  info.id = gameId;
  info.type = await client.get(`game:${gameId}:type`);
  info.port = await client.get(`game:${gameId}:port`);
  info.status = await client.get(`game:${gameId}:status`);
  info.hostId = await client.get(`game:${gameId}:hostId`);
  info.lobby = await client.get(`game:${gameId}:lobby`);
  info.settings = JSON.parse(
    (await client.get(`game:${gameId}:settings`)) || "{}"
  );
  info.createTime = Number(await client.get(`game:${gameId}:createTime`));
  info.startTime = Number(await client.get(`game:${gameId}:startTime`));
  info.webhookPublished = await client.exists(
    `game:${gameId}:webhookPublished`
  );
  info.setup = info.settings.setup;

  if (!info.settings.scheduled || info.settings.scheduled < Date.now())
    info.players = (await client.sMembers(`game:${gameId}:players`)) || [];
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
  return await client.get(`game:${gameId}:port`);
}

async function getGameType(gameId) {
  return await client.get(`game:${gameId}:type`);
}

async function getGameReservations(gameId, start, stop) {
  start = start != null ? start : 0;
  stop = stop != null ? stop : -1;
  return await client.zRange(`game:${gameId}:reservations`, start, stop);
}

async function setGameStatus(gameId, status) {
  await client.set(`game:${gameId}:status`, status);

  if (status == "In Progress")
    await client.set(`game:${gameId}:startTime`, Date.now());
}

async function getOpenGames(gameType) {
  var allGames = await client.sMembers("games");
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
  var allGames = await client.sMembers("games");
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
  var allGames = await client.sMembers("games");
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
  var allGames = await client.sMembers("games");
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
  var allGames = await client.sMembers("games");
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

    if (typeof val !== "string") val = JSON.stringify(val);

    await client.set(`game:${gameId}:${key}`, val);
  }

  await client.sAdd("games", gameId);

  if (info.settings.scheduled) {
    await client.sAdd("scheduledGames", gameId);
    await client.zAdd(`game:${gameId}:reservations`, { score: Date.now(), value: info.hostId });
  }
}

async function joinGame(userId, gameId, ranked, competitive) {
  const currentGame = await client.get(`user:${userId}:game`);

  if (currentGame == gameId) return;
  else if (currentGame != null) await leaveGame(userId);

  await client.sAdd(`game:${gameId}:players`, userId);
  await client.set(`user:${userId}:game`, gameId);

  if (ranked) {
    var ban = new models.Ban({
      id: nanoid(9),
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
      id: nanoid(9),
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
  const gameId = await client.get(`user:${userId}:game`);

  if (gameId) {
    await client.del(`user:${userId}:game`);
    await client.sRem(`game:${gameId}:players`, userId);
  }

  await models.Ban.deleteMany({ userId, type: "gameAuto" }).exec();
  await cacheUserPermissions(userId);
}

async function reserveGame(userId, gameId) {
  var game = await getGameInfo(gameId);

  if (!game || !game.settings.scheduled) return;

  var key = `game:${gameId}:reservations`;
  var numReservations = await client.zCard(key);
  await client.zAdd(key, { score: Date.now(), value: userId });

  return numReservations < game.settings.total;
}

async function unreserveGame(userId, gameId) {
  if (!(await gameExists(gameId))) return;

  await client.zRem(`game:${gameId}:reservations`, userId);
}

async function deleteGame(gameId, game) {
  if (!(await gameExists(gameId))) return;

  game = game || (await getGameInfo(gameId, true));

  for (let playerId of game.players) await leaveGame(playerId);

  if (game.settings.scheduled) {
    await client.sRem("scheduledGames", gameId);

    if ((await client.get(`user:${game.hostId}:scheduled`)) == game.id)
      await client.del(`user:${game.hostId}:scheduled`);
  }

  await client.sRem("games", gameId);
  await client.del(`game:${gameId}:id`);
  await client.del(`game:${gameId}:type`);
  await client.del(`game:${gameId}:port`);
  await client.del(`game:${gameId}:status`);
  await client.del(`game:${gameId}:hostId`);
  await client.del(`game:${gameId}:lobby`);
  await client.del(`game:${gameId}:players`);
  await client.del(`game:${gameId}:settings`);
  await client.del(`game:${gameId}:createTime`);
  await client.del(`game:${gameId}:startTime`);
  await client.del(`game:${gameId}:webhookPublished`);
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
    ranked: game.settings.ranked,
    competitive: game.settings.competitive,
    private: game.settings.private,
    guests: game.settings.guests,
    spectating: game.settings.spectating,
    voiceChat: game.settings.voiceChat,
    readyCheck: game.settings.readyCheck,
    noVeg: game.settings.noVeg,
    stateLengths: game.settings.stateLengths,
    gameTypeOptions: JSON.stringify(game.settings.gameTypeOptions),
    broken: true,
  });
  await game.save();
}

async function gameWebhookPublished(gameId) {
  await client.set(`game:${gameId}:webhookPublished`, "1");
}

async function registerGameServer(port) {
  await client.sAdd("gameServers", port.toString());
}

async function removeGameServer(port) {
  await client.sRem("gameServers", port.toString());
}

async function getNextGameServerPort() {
  var ports = await client.sMembers("gameServers");
  var index = await client.incr("gameServerIndex");

  index = Math.abs(index % ports.length);

  if (index === NaN || index === undefined || index === null) {
    index = 0;
  }

  return Number(ports[index]);
}

async function getAllGameServerPorts() {
  redis.createClient();
  var ports = await client.sMembers("gameServers");
  return ports.map((port) => Number(port));
}

async function getOnlineUsers(limit) {
  var limit = limit || Infinity;
  var users = await client.zRangeByScore(
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
  await client.zAdd("onlineUsers", { score: Date.now(), value: userId });
  await client.set(`user:${userId}:info:status`, "online");
  client.expire(`user:${userId}:info:status`, constants.userOnlineTTL / 1000);
}

async function setUserOffline(userId) {
  await client.zrem("onlineUsers", userId);
}

async function removeStaleUsers() {
  await client.zRemRangeByScore(
    "onlineUsers",
    0,
    Date.now() - constants.userOnlineTTL
  );
}

async function getAllLastActive() {
  var dates = {};
  var users = await client.zRange("onlineUsers", 0, -1);

  for (let user of users)
    dates[user] = await client.zScore("onlineUsers", user);

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
    (await client.exists(permKey)) && (await client.exists(rankKey));

  if (!exists) return await cacheUserPermissions(userId);
  else {
    const perms = await client.get(permKey);
    const rank = await client.get(rankKey);

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
  var keys = await client.keys("user:*:perms");

  for (let key of keys) await client.del(key);
}

async function rateLimit(userId, type) {
  var key = `user:${userId}:rateLimit:${type}`;
  var exists = await client.exists(key);

  if (!exists) {
    await client.set(key, 1);
    await client.pExpire(key, constants.rateLimits[type] || 0);
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
