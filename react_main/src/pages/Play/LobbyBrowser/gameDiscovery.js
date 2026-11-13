export function filterLobbyGames(games, status, query) {
  const term = query.trim().toLocaleLowerCase();
  return games.filter(game =>
    (status === "All" || game.status === status) &&
    (!term || [game.lobbyName, game.setup?.name, game.setup?.gameType, game.lobby]
      .some(value => String(value || "").toLocaleLowerCase().includes(term)))
  );
}
