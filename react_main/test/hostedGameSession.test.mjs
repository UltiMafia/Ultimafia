import test from "node:test";
import assert from "node:assert/strict";

import {
  hostedGameKey,
  isFreshGameSession,
  isMembershipUpdate,
  joinGameSessionState,
  membershipFromSearch,
  membershipSwitch,
  nextHostedGame,
  requestedMembership,
  spectateGameSessionState,
} from "../src/shared/hostedGameSession.js";

const playerSession = {
  id: "game-1",
  search: "",
  entryKey: "entry-a",
  membership: "player",
  request: null,
};

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
      request: null,
    }
  );
  assert.equal(membershipFromSearch(""), "player");
});

test("a different game replaces the session", () => {
  assert.deepEqual(
    nextHostedGame(playerSession, {
      gameId: "game-2",
      search: "?spectate=true",
      entryKey: "entry-b",
    }),
    {
      id: "game-2",
      search: "?spectate=true",
      entryKey: "entry-b",
      membership: "spectator",
      request: null,
    }
  );
});

test("returning to the same game without a fresh request keeps the session", () => {
  assert.equal(
    nextHostedGame(playerSession, {
      gameId: "game-1",
      search: "?spectate=true",
      entryKey: "entry-b",
      fresh: false,
    }),
    playerSession
  );
});

test("clicking the action matching the confirmed role keeps the session", () => {
  const kept = nextHostedGame(playerSession, {
    gameId: "game-1",
    search: "",
    entryKey: "entry-b",
    fresh: true,
    requested: "player",
  });
  assert.equal(kept.entryKey, "entry-a");
  assert.equal(kept.membership, "player");
  assert.equal(kept.request, null);
  assert.equal(hostedGameKey(kept), "game-1:entry-a");
});

test("a lobby click for the other role requests a socket switch without remounting", () => {
  const switching = nextHostedGame(playerSession, {
    gameId: "game-1",
    search: "?spectate=true",
    entryKey: "entry-b",
    fresh: true,
    requested: "spectator",
  });
  assert.deepEqual(switching, {
    ...playerSession,
    search: "?spectate=true",
    request: { membership: "spectator", nonce: "entry-b" },
  });
  assert.equal(hostedGameKey(switching), "game-1:entry-a");
});

test("a membership update changes the search without remounting or losing a request", () => {
  const switching = {
    ...playerSession,
    request: { membership: "spectator", nonce: "entry-b" },
  };
  const updated = nextHostedGame(switching, {
    gameId: "game-1",
    search: "?spectate=true",
    entryKey: "entry-c",
    membershipUpdate: true,
  });
  assert.deepEqual(updated, {
    ...switching,
    search: "?spectate=true",
  });
  assert.equal(hostedGameKey(updated), "game-1:entry-a");
});

test("membershipSwitch picks the in-place socket action", () => {
  assert.equal(membershipSwitch("player", "spectator"), "spectate");
  assert.equal(membershipSwitch("spectator", "player"), "takeSeat");
  assert.equal(membershipSwitch("player", "player"), null);
  assert.equal(membershipSwitch("spectator", "spectator"), null);
  assert.equal(membershipSwitch("player", null), null);
});

test("the game key changes only when the session is replaced", () => {
  assert.equal(hostedGameKey(playerSession), "game-1:entry-a");
  assert.equal(
    hostedGameKey(
      nextHostedGame(playerSession, {
        gameId: "game-2",
        search: "",
        entryKey: "entry-c",
      })
    ),
    "game-2:entry-c"
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
