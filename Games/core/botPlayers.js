// Who is a test bot and who is a guest.
//
// The game server has one flag, player.isBot, for anyone without a real
// account: guests (joined while logged out) and the dev Test-button / "?bot"
// players. Existing code keeps using isBot for "has no account" (no db
// writes, no hearts, can't receive kudos). Code that treats a game as a test
// run uses isTestBot, which leaves guests out.

function isGuestPlayer(player) {
  return !!(player && player.user && player.user.guestId);
}

// A dev's test bot: no account, and not a guest.
function isTestBotPlayer(player) {
  return !!(player && player.isBot && !isGuestPlayer(player));
}

module.exports = { isGuestPlayer, isTestBotPlayer };
