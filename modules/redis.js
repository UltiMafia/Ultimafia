const bluebird = require("bluebird");
const redis = bluebird.promisifyAll(require("redis"));
const shortid = require("shortid");
const sha1 = require("sha1");
const models = require("../db/models");
const constants = require("../data/constants");
const Random = require("../lib/Random");

const client = redis.createClient();

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
  }
  return await client.get(key);
}

async function cacheSetups(userId) {
  const key = `user:${userId}:favSetups`;
  const exists = await client.existsAsync(key);

  if (!exists) {
    const user = await models.User.findOne({ id: userId, deleted: false })
      .select("favSetups")
      .populate({
        path: "favSetups",
        select: "id",
      });

    if (!user) return;

    const setups = user.favSetups.map((setup) => setup.id);

    for (const setup of setups) client.sadd(key, setup);

    client.expire(key, 3600);
  }
}

async function getFavSetups(userId) {
  await cacheSetups(userId);
  const key = `user:${userId}:favSetups`;
  return await client.smembersAsync(key);
}

async function getFavSetupsHashtable(userId) {
  const setups = {};
  const setupList = await getFavSetups(userId);

  for (const setup of setupList) setups[setup] = true;

  return setups;
}

async function updateFavSetup(userId, setupId) {
  await cacheSetups(userId);

  const key = `user:${userId}:favSetups`;
  const isMember = await client.sismemberAsync(key, setupId);
  const setup = await models.Setup.findOne({ id: setupId });

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
  }
  if (setup) {
    const favSetupCount = await client.scardAsync(key);

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
  }
  return "0";
}

async function userCached(userId) {
  return client.existsAsync(`user:${userId}:info:id`);
}

async function cacheUserInfo(userId, reset) {
  const exists = await userCached(userId);

  if (!exists || reset) {
    let user = await models.User.findOne({ id: userId, deleted: false }).select(
      "id name avatar blockedUsers settings itemsOwned nameChanged bdayChanged birthday"
    );

    if (!user) return false;

    user = user.toJSON();

    await client.setAsync(`user:${userId}:info:id`, userId);
    await client.setAsync(`user:${userId}:info:name`, user.name);
    await client.setAsync(`user:${userId}:info:avatar`, user.avatar);
    await client.setAsync(`user:${userId}:info:nameChanged`, user.nameChanged);
    await client.setAsync(`user:${userId}:info:bdayChanged`, user.bdayChanged);
    await client.setAsync(`user:${userId}:info:birthday`, user.birthday);
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

    const inGroups = await models.InGroup.find({ user: user._id }).populate(
      "group",
      "id name rank badge badgeColor -_id"
    );
    const groups = inGroups.map((inGroup) => inGroup.toJSON().group);
    await client.setAsync(`user:${userId}:info:groups`, JSON.stringify(groups));
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
  await client.delAsync(`user:${userId}:info:id`);
  await client.delAsync(`user:${userId}:info:name`);
  await client.delAsync(`user:${userId}:info:avatar`);
  await client.delAsync(`user:${userId}:info:nameChanged`);
  await client.delAsync(`user:${userId}:info:bdayChanged`);
  await client.delAsync(`user:${userId}:info:birthday`);
  await client.delAsync(`user:${userId}:info:status`);
  await client.delAsync(`user:${userId}:info:blockedUsers`);
  await client.delAsync(`user:${userId}:info:settings`);
  await client.delAsync(`user:${userId}:info:itemsOwned`);
  await client.delAsync(`user:${userId}:info:groups`);
}

async function getUserInfo(userId) {
  const exists = await cacheUserInfo(userId);

  if (!exists) return;

  const info = {};
  info.id = await client.getAsync(`user:${userId}:info:id`);
  info.name = await client.getAsync(`user:${userId}:info:name`);
  info.avatar = (await client.getAsync(`user:${userId}:info:avatar`)) == "true";
  info.nameChanged =
    (await client.getAsync(`user:${userId}:info:nameChanged`)) == "true";
  info.bdayChanged =
    (await client.getAsync(`user:${userId}:info:bdayChanged`)) == "true";
  info.birthday = await client.getAsync(`user:${userId}:info:birthday`);
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

  return info;
}

async function getBasicUserInfo(userId, delTemplate) {
  const exists = await cacheUserInfo(userId);

  if (!exists && !delTemplate) return;
  if (!exists && delTemplate) {
    return {
      id: userId,
      name: "[deleted]",
      avatar: false,
      status: "offline",
      groups: [],
      settings: {},
    };
  }

  const info = {};
  info.id = await client.getAsync(`user:${userId}:info:id`);
  info.name = await client.getAsync(`user:${userId}:info:name`);
  info.avatar = (await client.getAsync(`user:${userId}:info:avatar`)) == "true";
  info.status = await client.getAsync(`user:${userId}:info:status`);
  info.groups = JSON.parse(await client.getAsync(`user:${userId}:info:groups`));

  const settings = JSON.parse(
    await client.getAsync(`user:${userId}:info:settings`)
  );
  info.settings = {
    nameColor: settings.nameColor,
    textColor: settings.textColor,
  };

  return info;
}

async function getUserName(userId) {
  const exists = await cacheUserInfo(userId);

  if (!exists) return;

  return await client.getAsync(`user:${userId}:info:name`);
}

async function getUserStatus(userId) {
  const exists = await cacheUserInfo(userId);

  if (!exists) return;

  const status = await client.getAsync(`user:${userId}:info:status`);
  return status || "offline";
}

async function getBlockedUsers(userId) {
  const exists = await cacheUserInfo(userId);

  if (!exists) return;

  const blockedUsers = await client.getAsync(
    `user:${userId}:info:blockedUsers`
  );
  return JSON.parse(blockedUsers || "[]");
}

async function getUserSettings(userId) {
  const exists = await cacheUserInfo(userId);

  if (!exists) return;

  const settings = await client.getAsync(`user:${userId}:info:settings`);
  return JSON.parse(settings || "{}");
}

async function getUserItemsOwned(userId) {
  const exists = await cacheUserInfo(userId);

  if (!exists) return;

  const settings = await client.getAsync(`user:${userId}:info:itemsOwned`);
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

  const info = {};

  info.id = gameId;
  info.type = await client.getAsync(`game:${gameId}:type`);
  info.port = await client.getAsync(`game:${gameId}:port`);
  info.status = await client.getAsync(`game:${gameId}:status`);
  info.hostId = await client.getAsync(`game:${gameId}:hostId`);
  info.lobby = await client.getAsync(`game:${gameId}:lobby`);
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
    const newPlayers = [];

    for (const playerId of info.players) {
      const userInfo = await getBasicUserInfo(playerId);

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

async function getOpenGames(gameType) {
  const allGames = await client.smembersAsync("games");
  const games = [];

  for (const gameId of allGames) {
    const game = await getGameInfo(gameId);

    if (game && (!gameType || game.type == gameType) && game.status == "Open") {
      games.push(game);
    }
  }

  return games;
}

async function getOpenPublicGames(gameType) {
  const allGames = await client.smembersAsync("games");
  const games = [];

  for (const gameId of allGames) {
    const game = await getGameInfo(gameId);

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
  const allGames = await client.smembersAsync("games");
  const games = [];

  for (const gameId of allGames) {
    const game = await getGameInfo(gameId);

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
  const allGames = await client.smembersAsync("games");
  const games = [];

  for (const gameId of allGames) {
    const game = await getGameInfo(gameId);

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
  const allGames = await client.smembersAsync("games");
  const games = [];

  for (const gameId of allGames) {
    const game = await getGameInfo(gameId);

    if (game && (!gameType || game.type == gameType)) games.push(game);
  }

  return games;
}

async function createGame(gameId, info) {
  for (const key in info) {
    let val = info[key];

    if (val == null) continue;

    if (typeof val === "object") val = JSON.stringify(val);

    await client.setAsync(`game:${gameId}:${key}`, val);
  }

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

async function joinGame(userId, gameId, ranked) {
  const currentGame = await client.getAsync(`user:${userId}:game`);

  if (currentGame == gameId) return;
  if (currentGame != null) await leaveGame(userId);

  await client.saddAsync(`game:${gameId}:players`, userId);
  await client.setAsync(`user:${userId}:game`, gameId);

  if (ranked) {
    const ban = new models.Ban({
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
  const game = await getGameInfo(gameId);

  if (!game || !game.settings.scheduled) return;

  const key = `game:${gameId}:reservations`;
  const numReservations = await client.zcardAsync(key);
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

  for (const playerId of game.players) await leaveGame(playerId);

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
  await client.delAsync(`game:${gameId}:players`);
  await client.delAsync(`game:${gameId}:settings`);
  await client.delAsync(`game:${gameId}:createTime`);
  await client.delAsync(`game:${gameId}:startTime`);
  await client.delAsync(`game:${gameId}:webhookPublished`);
}

async function breakGame(gameId) {
  if (!(await gameExists(gameId))) return;

  let game = await getGameInfo(gameId, true);
  await deleteGame(gameId);

  const setup = await models.Setup.findOne({ id: game.settings.setup });

  if (!setup) return;

  const setupId = setup._id;
  const users = [];

  for (const userId of game.players) {
    const user = await models.User.findOne({ id: userId }).select("_id");

    if (user) users.push(user._id);
  }

  game = new models.Game({
    id: game.id,
    type: game.type,
    setup: setupId,
    users,
    startTime: game.startTime,
    endTime: Date.now(),
    ranked: game.settings.ranked,
    private: game.settings.private,
    guests: game.settings.guests,
    spectating: game.settings.spectating,
    voiceChat: game.settings.voiceChat,
    readyCheck: game.settings.readyCheck,
    stateLengths: game.settings.stateLengths,
    gameTypeOptions: JSON.stringify(game.settings.gameTypeOptions),
    broken: true,
  });
  await game.save();
}

async function gameWebhookPublished(gameId) {
  await client.setAsync(`game:${gameId}:webhookPublished`, "1");
}

async function registerGameServer(port) {
  await client.saddAsync("gameServers", port);
}

// async function removeGameServer(port) {
//   await client.sremAsync("gameServers", port);
// }

async function getNextGameServerPort() {
  const ports = await client.smembersAsync("gameServers");
  let index = await client.incrAsync("gameServerIndex");

  index = Math.abs(index % ports.length);

  if (index === NaN || index === undefined || index === null) {
    index = 0;
  }

  return Number(ports[index]);
}

async function getAllGameServerPorts() {
  const ports = await client.smembersAsync("gameServers");
  return ports.map((port) => Number(port));
}

async function getOnlineUsers(limit) {
  var limit = limit || Infinity;
  const users = await client.zrangebyscoreAsync(
    "onlineUsers",
    Date.now() - constants.userOnlineTTL,
    Infinity
  );
  return users.slice(0, limit);
}

async function getOnlineUsersInfo(limit) {
  const userIds = await getOnlineUsers(limit);
  const users = [];

  for (const userId of userIds) {
    const user = await getBasicUserInfo(userId);

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
  const dates = {};
  const users = await client.zrangeAsync("onlineUsers", 0, -1);

  for (const user of users)
    dates[user] = await client.zscoreAsync("onlineUsers", user);

  return dates;
}

async function cacheUserPermissions(userId) {
  const permKey = `user:${userId}:perms`;
  const rankKey = `user:${userId}:rank`;

  let user = await models.User.findOne({ id: userId, deleted: false }).select(
    "rank permissions"
  );

  if (!user) return { perms: {}, rank: 0, noUser: true };

  user = user.toJSON();

  const inGroups = await models.InGroup.find({ user: user._id }).populate(
    "group",
    "rank permissions"
  );
  const groups = inGroups.map((inGroup) => inGroup.toJSON().group);

  const bans = await models.Ban.find({ userId }).select("permissions");

  const perms = {};
  let maxRank = user.rank || 0;

  for (const perm of constants.defaultPerms) perms[perm] = true;

  for (const perm of user.permissions) perms[perm] = true;

  for (const group of groups) {
    for (const perm of group.permissions) perms[perm] = true;

    if (group.rank > maxRank) maxRank = group.rank;
  }

  for (const ban of bans)
    for (const perm of ban.permissions) delete perms[perm];

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

  const perms = await client.getAsync(permKey);
  const rank = await client.getAsync(rankKey);

  client.expire(permKey, 3600);
  client.expire(rankKey, 3600);

  return {
    perms: JSON.parse(perms),
    rank: Number(rank),
  };
}

async function getUserRank(userId) {
  const perms = await getUserPermissions(userId);
  return !perms.noUser ? perms.rank : null;
}

async function hasPermissions(userId, perms, rank) {
  if (!userId) return false;

  const permInfo = await getUserPermissions(userId);

  if (permInfo.rank < rank) return false;

  for (const perm of perms)
    if (perm != null && permInfo.perms[perm] == null) return false;

  return true;
}

async function hasPermission(userId, perm, rank) {
  return await hasPermissions(userId, [perm], rank);
}

async function clearPermissionCache() {
  const keys = await client.keysAsync("user:*:perms");

  for (const key of keys) await client.delAsync(key);
}

async function rateLimit(userId, type) {
  const key = `user:${userId}:rateLimit:${type}`;
  const exists = await client.existsAsync(key);

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
  // removeGameServer,
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
