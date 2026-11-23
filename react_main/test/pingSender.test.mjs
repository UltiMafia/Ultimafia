import assert from "node:assert/strict";
import test from "node:test";

import { pingSenderName } from "../src/utils/pingSender.js";

const players = {
  p1: { id: "p1", name: "Aspect" },
  p2: { id: "p2", name: "Bystander" },
};
const spectators = {
  s1: { id: "s1", name: "Watcher" },
  s2: { id: "s2", name: undefined },
};

test("names a player who pings you", () => {
  assert.equal(pingSenderName({ senderId: "p1" }, players, spectators), "Aspect");
});

test("names a spectator who pings you in the pregame lobby", () => {
  // The bug: spectators are not in `players`, so this returned undefined and the
  // notice read "undefined pinged you!".
  assert.equal(
    pingSenderName({ senderId: "s1" }, players, spectators),
    "Watcher"
  );
});

test("falls back to the spectator map when the player map misses", () => {
  assert.equal(
    pingSenderName({ senderId: "s1" }, { p1: { name: "Aspect" } }, spectators),
    "Watcher"
  );
});

test("returns null for an unknown sender", () => {
  assert.equal(pingSenderName({ senderId: "nobody" }, players, spectators), null);
});

test("returns null when the spectator has no name yet", () => {
  assert.equal(pingSenderName({ senderId: "s2" }, players, spectators), null);
});

test("returns null without a sender or without maps", () => {
  assert.equal(pingSenderName({}, players, spectators), null);
  assert.equal(pingSenderName(null, players, spectators), null);
  assert.equal(pingSenderName({ senderId: "p1" }, undefined, undefined), null);
});
