import test from "node:test";
import assert from "node:assert/strict";
import {
  completePlayerName,
  tabCompleteNames,
} from "../src/shared/tabComplete.js";

test("completes a unique name", () => {
  assert.equal(completePlayerName("vin", ["Vinman", "Aspect"]), "Vinman");
});

test("keeps leading punctuation", () => {
  assert.equal(completePlayerName("@vin", ["Vinman", "Aspect"]), "@Vinman");
});

test("completes to the common prefix of several names", () => {
  assert.equal(completePlayerName("ga", ["Gauss", "Gamer", "Aspect"]), "Ga");
  assert.equal(completePlayerName("mt", ["mtpranay1", "mtpranay2"]), "mtpranay");
});

test("returns the name when it appears twice (player left a seat and sat back down)", () => {
  // Before the fix this spun forever: undefined === undefined past the end of both names.
  assert.equal(completePlayerName("vin", ["Vinman", "Aspect", "Vinman"]), "Vinman");
  assert.equal(completePlayerName("Vinman", ["Vinman", "Vinman"]), "Vinman");
});

test("stops at the shorter name when one name is a prefix of another", () => {
  assert.equal(completePlayerName("bo", ["Bob", "Bobby"]), "Bob");
});

test("returns null when nothing matches and undefined when there is no seed", () => {
  assert.equal(completePlayerName("zz", ["Vinman"]), null);
  assert.equal(completePlayerName("", ["Vinman"]), undefined);
  assert.equal(completePlayerName("!", ["Vinman"]), undefined);
});

test("ignores empty and non-string names", () => {
  assert.equal(completePlayerName("a", ["", null, undefined, 3, "Alice"]), "Alice");
});

test("a left and rejoined player completes once", () => {
  const players = {
    a: { id: "a", name: "Alice" },
    b1: { id: "b1", name: "Bob", left: true },
    b2: { id: "b2", name: "Bob" },
  };
  const names = tabCompleteNames({ players, spectators: {}, isPregame: true });
  assert.deepEqual(names, ["Alice", "Bob"]);
  assert.equal(completePlayerName("b", names), "Bob");
});

test("a player and a spectator with the same name complete once", () => {
  const names = tabCompleteNames({
    players: { a: { id: "a", name: "Bob" } },
    spectators: { s: { id: "s", name: "Bob", watching: true } },
    isPregame: true,
  });
  assert.deepEqual(names, ["Bob"]);
  assert.equal(completePlayerName("bo", names), "Bob");
});
