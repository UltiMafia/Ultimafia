import test from "node:test";
import assert from "node:assert/strict";

import {
  FRESH_GAME_SESSION_STATE,
  hostedGameKey,
  isFreshGameSession,
  nextHostedGame,
} from "../src/shared/hostedGameSession.js";

test("first entry creates a session with its join search", () => {
  assert.deepEqual(
    nextHostedGame(null, {
      gameId: "game-1",
      search: "?spectate=true",
      entryKey: "entry-a",
    }),
    { id: "game-1", search: "?spectate=true", entryKey: "entry-a" }
  );
});

test("a different game replaces the session", () => {
  const current = { id: "game-1", search: "", entryKey: "entry-a" };
  assert.deepEqual(
    nextHostedGame(current, {
      gameId: "game-2",
      search: "?spectate=true",
      entryKey: "entry-b",
    }),
    { id: "game-2", search: "?spectate=true", entryKey: "entry-b" }
  );
});

test("returning to the same game without a fresh request keeps the session", () => {
  const current = { id: "game-1", search: "", entryKey: "entry-a" };
  assert.equal(
    nextHostedGame(current, {
      gameId: "game-1",
      search: "?spectate=true",
      entryKey: "entry-b",
      fresh: false,
    }),
    current
  );
});

test("a lobby Join/Spectate click replaces a retained session once", () => {
  const current = { id: "game-1", search: "", entryKey: "entry-a" };
  const replaced = nextHostedGame(current, {
    gameId: "game-1",
    search: "?spectate=true",
    entryKey: "entry-b",
    fresh: true,
  });
  assert.deepEqual(replaced, {
    id: "game-1",
    search: "?spectate=true",
    entryKey: "entry-b",
  });

  // The same history entry must not replace it again (Back/Forward).
  assert.equal(
    nextHostedGame(replaced, {
      gameId: "game-1",
      search: "?spectate=true",
      entryKey: "entry-b",
      fresh: true,
    }),
    replaced
  );
});

test("a new lobby click after the first still replaces the session", () => {
  const current = { id: "game-1", search: "?spectate=true", entryKey: "entry-b" };
  assert.deepEqual(
    nextHostedGame(current, {
      gameId: "game-1",
      search: "",
      entryKey: "entry-c",
      fresh: true,
    }),
    { id: "game-1", search: "", entryKey: "entry-c" }
  );
});

test("the game key changes only when the session is replaced", () => {
  const current = { id: "game-1", search: "?spectate=true", entryKey: "entry-b" };
  assert.equal(hostedGameKey(current), "game-1:entry-b");
  assert.equal(
    hostedGameKey(
      nextHostedGame(current, {
        gameId: "game-1",
        search: "",
        entryKey: "entry-c",
        fresh: true,
      })
    ),
    "game-1:entry-c"
  );
  assert.equal(hostedGameKey(null), null);
});

test("the lobby navigation state is recognised", () => {
  assert.equal(isFreshGameSession(FRESH_GAME_SESSION_STATE), true);
  assert.equal(isFreshGameSession({ freshGameSession: false }), false);
  assert.equal(isFreshGameSession(null), false);
});
