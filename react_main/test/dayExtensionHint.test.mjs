import test from "node:test";
import assert from "node:assert/strict";
import { dayExtensionHint } from "../src/utils/dayExtensionHint.js";

function game(overrides = {}) {
  return {
    gameType: "Mafia",
    history: { currentState: 1, states: { 1: { name: "Day" } } },
    options: { gameTypeOptions: {} },
    ...overrides,
  };
}

test("Day command help includes the exact command and default duration", () => {
  assert.equal(dayExtensionHint(game(), true),
    "Vote to extend Day: type /extend and press Enter (3 minutes).");
});

test("numbered Days use the server phase-name convention", () => {
  assert.equal(dayExtensionHint(game({
    history: { currentState: 2, states: { 2: { name: "Day 2" } } },
  }), true), dayExtensionHint(game(), true));
});

test("configured zero is disabled, positive durations are preserved", () => {
  for (const [minutes, expected] of [
    [0, "Day extensions are disabled."],
    ["0", "Day extensions are disabled."],
    ["5", "Vote to extend Day: type /extend and press Enter (5 minutes)."],
    [1, "Vote to extend Day: type /extend and press Enter (1 minute)."],
    ["1", "Vote to extend Day: type /extend and press Enter (1 minute)."],
    [5, "Vote to extend Day: type /extend and press Enter (5 minutes)."],
    [null, "Vote to extend Day: type /extend and press Enter (3 minutes)."],
  ]) {
    assert.equal(dayExtensionHint(game({
      options: { gameTypeOptions: { extendLength: minutes } },
    }), true), expected);
  }
});

test("no hint for another game, night, pregame, review, spectator, or finished game", () => {
  for (const overrides of [
    { gameType: "Jotto" }, { review: true }, { isSpectator: true },
    { finished: true },
    { history: { currentState: 1, states: { 1: { name: "Night" } } } },
    { history: { currentState: -1, states: { [-1]: { name: "Pregame" } } } },
    { history: undefined },
  ]) assert.equal(dayExtensionHint(game(overrides), true), null);
  assert.equal(dayExtensionHint(game(), false), null);
});

test("help does not infer private eligibility or a submitted vote", () => {
  assert.equal(dayExtensionHint(game({ players: { self: { housed: true, alive: false } } }), true),
    dayExtensionHint(game(), true));
});
