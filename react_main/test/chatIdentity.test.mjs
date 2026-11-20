import assert from "node:assert/strict";
import { test } from "node:test";
import identity from "../src/shared/chatIdentity.js";

const { findChatIdentity } = identity;

test("chat avatars can resolve both kinds of departed participant", () => {
  const player = { name: "FormerSeat", left: true, avatar: true, userId: "a" };
  const spectator = { name: "FormerWatcher", watching: false, avatar: true, userId: "b" };
  assert.equal(findChatIdentity("formerseat", { a: player }, { b: spectator }), player);
  assert.equal(findChatIdentity("formerwatcher", { a: player }, { b: spectator }), spectator);
  assert.equal(findChatIdentity("formerwatcher", { a: player }), undefined);
});

test("a current appearance takes precedence over a matching historical one", () => {
  const old = { name: "Same", left: true };
  const current = { name: "Same", watching: true };
  assert.equal(findChatIdentity("same", { old }, { current }), current);
});
