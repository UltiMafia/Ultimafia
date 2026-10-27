// Who may read and send direct messages (1:1 and group DMs).
//
// DMs are locked only while the user is a seated, alive player in a ranked or
// competitive game that is actually running. Waiting in a pregame lobby, being
// dead, having left, spectating, unranked games and finished (postgame) games
// are all fine.
//
// The chat server (modules/chat.js) is the source of truth and checks this on
// every DM getChannel, getOldMessages, sendMessage, newDMChannel and live
// message delivery. GET /api/chat/dmAccess exposes the same answer to clients.
const redis = require("./redis");
const models = require("../db/models");

const DM_LOCKED_MESSAGE =
  "Direct messages are locked while you're alive in a ranked or competitive game that's in progress.";

// Pure rule. `game` is redis.getGameInfo(gameId, true); `deadIds` are the
// user ids recorded dead in that game.
function dmLockedByGame({ userId, game, deadIds }) {
  if (!userId || !game) return false;
  const settings = game.settings || {};
  if (!settings.ranked && !settings.competitive) return false;
  if (game.status !== "In Progress") return false;
  if (game.gameState === "Postgame") return false;
  const players = game.players || [];
  if (!players.includes(userId)) return false;
  if ((deadIds || []).includes(userId)) return false;
  return true;
}

// { locked: false } or { locked: true, gameId, message }.
async function getDmAccess(userId) {
  if (!userId) return { locked: false };
  const gameId = await redis.inGame(userId);
  if (!gameId) return { locked: false };
  const game = await redis.getGameInfo(gameId, true);
  if (!game) return { locked: false };
  const deadIds = await redis.getDeadPlayers(gameId);
  if (!dmLockedByGame({ userId, game, deadIds })) return { locked: false };
  return { locked: true, gameId, message: DM_LOCKED_MESSAGE };
}

// Joining a ranked/competitive game adds a "gameAuto" ban that removes
// privateChat from the moment the user takes a seat. For DMs that lock is
// replaced by getDmAccess, so privateChat counts as granted when the only
// thing removing it is a gameAuto ban. Real bans still apply.
async function hasPrivateChat(userId, permInfo) {
  if (permInfo && permInfo.perms && permInfo.perms.privateChat) return true;
  const bans = await models.Ban.find({
    userId,
    permissions: "privateChat",
    $or: [{ expires: 0 }, { expires: { $gt: Date.now() } }],
  }).select("type");
  if (bans.length === 0) return false;
  return bans.every((ban) => ban.type === "gameAuto");
}

module.exports = {
  DM_LOCKED_MESSAGE,
  dmLockedByGame,
  getDmAccess,
  hasPrivateChat,
};
