import test from "node:test";
import assert from "node:assert/strict";
import { buildNameMasker, collectPlayerNames } from "../src/utils/nameMasking.js";

const mask = buildNameMasker(["worstplayer", "Thing", "tn-Br3IPh", "a", "Z"]);

test("masks a name used as a target", () => {
  assert.equal(mask("@worstplayer@worstplayer"), "@PLAYER@PLAYER");
  assert.equal(mask("loss on you worstplayer"), "loss on you PLAYER");
  assert.equal(mask("worstplayer shitpushing"), "PLAYER shitpushing");
});

test("is case-insensitive and keeps punctuation", () => {
  assert.equal(mask("WorstPlayer, why"), "PLAYER, why");
  assert.equal(mask("@WorstPlayer: hi"), "@PLAYER: hi");
});

test("leaves genuine attacks intact", () => {
  assert.equal(mask("U FUCKING MORON"), "U FUCKING MORON");
  assert.equal(mask("worstplayer u are a moron"), "PLAYER u are a moron");
});

test("does not match inside longer tokens", () => {
  assert.equal(mask("worstplayer2"), "worstplayer2");
  assert.equal(mask("aworstplayer"), "aworstplayer");
  assert.equal(mask("worstplayers"), "worstplayers");
});

test("short names and single letters are not masked", () => {
  assert.equal(mask("a Z thing"), "a Z PLAYER");
});

test("names with hyphens and digits are masked as whole tokens", () => {
  assert.equal(mask("vote tn-Br3IPh now"), "vote PLAYER now");
  assert.equal(mask("tn-Br3IPhX"), "tn-Br3IPhX");
});

test("regex metacharacters in names are escaped", () => {
  const m = buildNameMasker(["a.b(c)"]);
  assert.equal(m("ask a.b(c) now"), "ask PLAYER now");
  assert.equal(m("ask axbxc now"), "ask axbxc now");
});

test("no names returns the text unchanged", () => {
  const identity = buildNameMasker([]);
  assert.equal(identity("anything at all"), "anything at all");
  assert.equal(identity(null), "");
});

test("collects players and spectators, ignoring missing names", () => {
  const names = collectPlayerNames(
    { p1: { name: "One" }, p2: { name: "Two" }, p3: {} },
    { s1: { name: "Spected" } }
  );
  assert.deepEqual(names, ["One", "Two", "Spected"]);
});
