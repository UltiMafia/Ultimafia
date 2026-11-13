import test from "node:test";
import assert from "node:assert/strict";
import { filterLobbyGames } from "../src/pages/Play/LobbyBrowser/gameDiscovery.js";

const games = [
  { id: "open", status: "Open", lobbyName: "Juniper's table", lobby: "Main", setup: { name: "Classic", gameType: "Mafia" } },
  { id: "live", status: "In Progress", lobbyName: "Late night", lobby: "Sandbox", setup: { name: "Chaos", gameType: "Mafia" } },
  { id: "finished", status: "Finished", lobbyName: "Archives", setup: null },
];
test("game filters preserve order and never mutate the fetched page", () => {
  const original = structuredClone(games);
  assert.deepEqual(filterLobbyGames(games, "All", ""), games);
  assert.notEqual(filterLobbyGames(games, "All", ""), games);
  assert.deepEqual(games, original);
});
test("each status is distinct, including full open games", () => {
  for (const game of games) assert.deepEqual(filterLobbyGames(games, game.status, ""), [game]);
  const full = { ...games[0], players: 7, setup: { total: 7 } };
  assert.deepEqual(filterLobbyGames([full], "Open", ""), [full]);
});
test("search is trimmed and case insensitive across names, lobbies and game types", () => {
  assert.deepEqual(filterLobbyGames(games, "All", " CLASSIC "), [games[0]]);
  assert.deepEqual(filterLobbyGames(games, "All", "juniper"), [games[0]]);
  assert.deepEqual(filterLobbyGames(games, "All", "sandbox"), [games[1]]);
  assert.deepEqual(filterLobbyGames(games, "All", "mafia"), games.slice(0, 2));
});
test("search and status intersect; missing setup data does not crash", () => {
  assert.deepEqual(filterLobbyGames(games, "Open", "chaos"), []);
  assert.deepEqual(filterLobbyGames(games, "All", "not found"), []);
  assert.deepEqual(filterLobbyGames(games, "Finished", "archive"), [games[2]]);
});
