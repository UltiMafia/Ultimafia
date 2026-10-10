// Postgame "Rehost": carry the finished game's lobby settings into the new
// lobby, and tell everyone still in the old game where the new one is.
const models = require("../db/models");
const redis = require("./redis");

// Body fields of POST /api/game/host that describe the lobby. Everything here
// is taken from the old game when a participant rehosts it. Not carried:
//  - scheduled: a rehost starts a lobby now; an old start time is in the past.
//  - rehost: always the id being rehosted.
//  - gameType: must match the request (a rehost never changes the game type).
const CARRIED_FIELDS = [
  "setup",
  "lobby",
  "lobbyName",
  "private",
  "guests",
  "ranked",
  "competitive",
  "spectating",
  "readyCheck",
  "noVeg",
  "stateLengths",
  "anonymousGame",
  "anonymousDeckId",
  // + every key of the game type's getGameTypeOptions() (e.g. Mafia:
  //   extendLength, pregameWaitLength, advancedHosting; Jotto: wordLength...)
];

function parseJSON(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

/**
 * Pure: turns a game's stored settings into the /api/game/host body that
 * recreates it. `source` = { setupId, lobby, lobbyName, private, guests,
 * ranked, competitive, spectating, readyCheck, noVeg, stateLengths (ms),
 * anonymousGame, anonymousDeck ([{id}] or ids), gameTypeOptions (obj|JSON) }.
 */
function buildRehostBody(source) {
  const gameTypeOptions = parseJSON(source.gameTypeOptions, {}) || {};
  const stateLengths = {};
  for (const [stateName, ms] of Object.entries(source.stateLengths || {})) {
    // /host takes minutes and converts back to ms
    if (Number.isFinite(Number(ms))) stateLengths[stateName] = Number(ms) / 60000;
  }
  const deckIds = (source.anonymousDeck || [])
    .map((deck) => (deck && typeof deck === "object" ? deck.id : deck))
    .filter(Boolean)
    .map(String);
  const anonymousGame = Boolean(source.anonymousGame) && deckIds.length > 0;

  return {
    ...gameTypeOptions,
    setup: source.setupId,
    lobby: source.lobby,
    lobbyName: source.lobbyName || undefined,
    private: Boolean(source.private),
    guests: Boolean(source.guests),
    ranked: Boolean(source.ranked),
    competitive: Boolean(source.competitive),
    spectating: Boolean(source.spectating),
    readyCheck: Boolean(source.readyCheck),
    noVeg: Boolean(source.noVeg),
    stateLengths,
    anonymousGame,
    anonymousDeckId: anonymousGame ? deckIds.join(",") : undefined,
  };
}

/**
 * Settings of game `rehostId`, if `userId` took part in it (host, player or,
 * once finished, any recorded user). Prefers the live game (still in postgame
 * in redis); falls back to the saved game record. Returns
 * { gameType, body, hostId } or null.
 */
async function getRehostSource(rehostId, userId) {
  if (!rehostId || !userId) return null;

  const live = await redis.getGameInfo(rehostId, true);
  const record = await models.Game.findOne({ id: rehostId, broken: { $ne: true } })
    .select(
      "type lobby lobbyName setup users private guests ranked competitive spectating readyCheck noVeg stateLengths gameTypeOptions anonymousGame anonymousDeck"
    )
    .populate("setup", "id")
    .lean();

  const user = record
    ? await models.User.findOne({ id: userId }).select("_id").lean()
    : null;
  const inRecord = Boolean(
    record && user && (record.users || []).some((u) => u && String(u) === String(user._id))
  );
  const inLive = Boolean(
    live && (live.hostId === userId || (live.players || []).includes(userId))
  );
  if (!inRecord && !inLive) return null;

  if (live && live.settings && live.settings.setup) {
    const s = live.settings;
    return {
      gameType: live.type,
      hostId: live.hostId,
      body: buildRehostBody({ ...s, setupId: s.setup, lobby: live.lobby }),
    };
  }
  if (record && record.setup) {
    return {
      gameType: record.type,
      hostId: null,
      body: buildRehostBody({ ...record, setupId: record.setup.id }),
    };
  }
  return null;
}

/**
 * The part of a setup the client needs to draw it (name + role icons) in the
 * rehost invite. Same fields the lobby list sends for a setup.
 */
function setupSummary(setup) {
  if (!setup) return null;

  const pick = ({ id, name, gameType, roles, closed, unique, uniqueWithoutModifier, count, total, useRoleGroups, roleGroupSizes }) => ({
    id,
    name,
    gameType,
    roles,
    closed,
    unique,
    uniqueWithoutModifier,
    count,
    total,
    useRoleGroups,
    roleGroupSizes,
  });

  return pick(typeof setup.toJSON === "function" ? setup.toJSON() : setup);
}

module.exports = { CARRIED_FIELDS, buildRehostBody, getRehostSource, setupSummary };
