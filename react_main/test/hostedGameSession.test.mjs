import test from "node:test";
import assert from "node:assert/strict";

import {
  hostedGameKey,
  isFreshGameSession,
  isMembershipUpdate,
  joinGameSessionState,
  membershipFromSearch,
  nextHostedGame,
  requestedMembership,
  spectateGameSessionState,
} from "../src/shared/hostedGameSession.js";

test("first entry creates a session with its join search and role", () => {
  assert.deepEqual(
    nextHostedGame(null, {
      gameId: "game-1",
      search: "?spectate=true",
      entryKey: "entry-a",
    }),
    {
      id: "game-1",
      search: "?spectate=true",
      entryKey: "entry-a",
      membership: "spectator",
    }
  );
  assert.equal(membershipFromSearch(""), "player");
});

test("a different game replaces the session", () => {
  const current = {
    id: "game-1",
    search: "",
    entryKey: "entry-a",
    membership: "player",
  };
  assert.deepEqual(
    nextHostedGame(current, {
      gameId: "game-2",
      search: "?spectate=true",
      entryKey: "entry-b",
    }),
    {
      id: "game-2",
      search: "?spectate=true",
      entryKey: "entry-b",
      membership: "spectator",
    }
  );
});

test("returning to the same game without a fresh request keeps the session", () => {
  const current = {
    id: "game-1",
    search: "",
    entryKey: "entry-a",
    membership: "player",
  };
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

test("clicking the action matching the confirmed role keeps the mounted session", () => {
  const current = {
    id: "game-1",
    search: "",
    entryKey: "entry-a",
    membership: "player",
  };
  const kept = nextHostedGame(current, {
    gameId: "game-1",
    search: "?join=true",
    entryKey: "entry-b",
    fresh: true,
    requested: "player",
  });
  assert.equal(kept.entryKey, "entry-a");
  assert.equal(kept.membership, "player");
  assert.equal(kept.search, "?join=true");
  assert.equal(hostedGameKey(kept), "game-1:entry-a");
});

test("a lobby click for the other role replaces the session", () => {
  const current = {
    id: "game-1",
    search: "?join=true",
    entryKey: "entry-a",
    membership: "player",
  };
  assert.deepEqual(
    nextHostedGame(current, {
      gameId: "game-1",
      search: "?spectate=true",
      entryKey: "entry-b",
      fresh: true,
      requested: "spectator",
    }),
    {
      id: "game-1",
      search: "?spectate=true",
      entryKey: "entry-b",
      membership: "spectator",
    }
  );
});

test("a membership update changes the search without remounting", () => {
  const current = {
    id: "game-1",
    search: "?join=true",
    entryKey: "entry-a",
    membership: "player",
  };
  const updated = nextHostedGame(current, {
    gameId: "game-1",
    search: "?spectate=true",
    entryKey: "entry-b",
    membershipUpdate: true,
  });
  assert.deepEqual(updated, {
    id: "game-1",
    search: "?spectate=true",
    entryKey: "entry-a",
    membership: "player",
  });
  assert.equal(hostedGameKey(updated), "game-1:entry-a");
});

test("the game key changes only when the session is replaced", () => {
  const current = {
    id: "game-1",
    search: "?spectate=true",
    entryKey: "entry-b",
    membership: "spectator",
  };
  assert.equal(hostedGameKey(current), "game-1:entry-b");
  assert.equal(
    hostedGameKey(
      nextHostedGame(current, {
        gameId: "game-1",
        search: "",
        entryKey: "entry-c",
        fresh: true,
        requested: "player",
      })
    ),
    "game-1:entry-c"
  );
  assert.equal(hostedGameKey(null), null);
});

test("lobby navigation states carry the requested role", () => {
  const join = joinGameSessionState();
  const spectate = spectateGameSessionState();
  assert.equal(isFreshGameSession(join), true);
  assert.equal(requestedMembership(join), "player");
  assert.equal(isFreshGameSession(spectate), true);
  assert.equal(requestedMembership(spectate), "spectator");
  assert.equal(isMembershipUpdate({ membershipUpdate: true }), true);
  assert.equal(isMembershipUpdate(null), false);
});
