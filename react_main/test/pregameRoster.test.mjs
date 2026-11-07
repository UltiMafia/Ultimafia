import test from "node:test";
import assert from "node:assert/strict";
import { mergeDepartedPregamePlayers } from "../src/utils/pregameRoster.js";

const seat = (id, name, extra = {}) => ({
  id,
  userId: `u-${id}`,
  name,
  avatar: true,
  textColor: "#123456",
  nameColor: "#abcdef",
  left: true,
  ...extra,
});

test("adds a departed seat so its pregame messages have a name and avatar", () => {
  const players = { seated: { id: "seated", name: "KevinDeng", left: false } };

  mergeDepartedPregamePlayers(players, JSON.stringify({ gone: seat("gone", "old") }));

  assert.equal(players.gone.name, "old");
  assert.equal(players.gone.avatar, true);
  assert.equal(players.gone.textColor, "#123456");
  assert.equal(players.gone.left, true);
  assert.equal(players.gone.departedPregame, true);
});

test("accepts an already parsed object", () => {
  const players = {};
  mergeDepartedPregamePlayers(players, { gone: seat("gone", "old") });
  assert.equal(players.gone.name, "old");
});

test("never overwrites a player who is still seated", () => {
  const players = { a: { id: "a", name: "KevinDeng", left: false } };
  mergeDepartedPregamePlayers(players, { a: seat("a", "wrong name") });
  assert.equal(players.a.name, "KevinDeng");
  assert.equal(players.a.left, false);
});

test("survives missing, broken or empty payloads", () => {
  const players = { a: { id: "a", name: "KevinDeng" } };

  assert.deepEqual(mergeDepartedPregamePlayers(players, undefined), players);
  assert.deepEqual(mergeDepartedPregamePlayers(players, "not json"), players);
  assert.deepEqual(mergeDepartedPregamePlayers(players, ""), players);
  assert.deepEqual(mergeDepartedPregamePlayers(players, {}), players);
});

test("tolerates a seat record with no fields", () => {
  const players = {};
  mergeDepartedPregamePlayers(players, { gone: null });

  assert.equal(players.gone.id, "gone");
  assert.equal(players.gone.avatar, false);
  assert.equal(players.gone.userId, "");
  assert.equal(players.gone.left, true);
});
