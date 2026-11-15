import assert from "node:assert/strict";
import test from "node:test";

import { gameUrlTarget } from "../src/utils/gameUrlSync.js";

test("keeps the URL on the hosted game", () => {
  assert.equal(
    gameUrlTarget({ routeGameId: "abc123", gameId: "abc123", isSpectator: false }),
    "/game/abc123"
  );
});

test("keeps ?spectate=true when the server seated you as a spectator", () => {
  assert.equal(
    gameUrlTarget({ routeGameId: "abc123", gameId: "abc123", isSpectator: true }),
    "/game/abc123?spectate=true"
  );
});

test("stands down when the URL names a different game", () => {
  // The bug: reviewing game A, clicking review on game B from a profile. The
  // retained session for A re-asserted its own URL and won the race.
  assert.equal(
    gameUrlTarget({ routeGameId: "gameB", gameId: "gameA", isSpectator: false }),
    null
  );
});

test("stands down on a site page", () => {
  assert.equal(
    gameUrlTarget({ routeGameId: null, gameId: "gameA", isSpectator: false }),
    null
  );
});

test("does nothing without a hosted game", () => {
  assert.equal(
    gameUrlTarget({ routeGameId: "abc123", gameId: null, isSpectator: false }),
    null
  );
});
