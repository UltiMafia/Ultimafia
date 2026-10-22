const constants = require("../../data/constants");

const limits = constants.devApi;

function isTestingGame(game) {
  return Boolean(game) && game.lobby == constants.testingLobby;
}

function isLockedGame(game) {
  return isTestingGame(game) || Boolean(game.settings && game.settings.private);
}

function placementError({ game, developerAccounts, gameTestAccounts, canUsePublic }) {
  if (!game) return "Game not found.";
  if (game.status && game.status != "Open") return "Test accounts can only join open games.";
  if (developerAccounts >= limits.maxTestAccountsInGame)
    return `You can have at most ${limits.maxTestAccountsInGame} test accounts in games at once.`;
  if (isLockedGame(game)) return null;
  if (!canUsePublic) return "Test accounts can only join locked lobbies.";
  if (gameTestAccounts >= limits.maxTestAccountsInPublicGame)
    return `Only ${limits.maxTestAccountsInPublicGame} test account may join a public lobby.`;
  return null;
}

function devApiEnabled() {
  return process.env.DEV_API_ENABLED != "false";
}

module.exports = { isTestingGame, isLockedGame, placementError, devApiEnabled };
