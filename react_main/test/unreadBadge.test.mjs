import test from "node:test";
import assert from "node:assert/strict";
import { formatUnreadBadge } from "../src/utils/unreadBadge.js";

test("no badge at zero or for missing/invalid counts", () => {
  for (const v of [0, -3, null, undefined, NaN, "", "abc"]) {
    assert.equal(formatUnreadBadge(v), null, String(v));
  }
});

test("shows the count from 1 to 99", () => {
  assert.equal(formatUnreadBadge(1), "1");
  assert.equal(formatUnreadBadge(7), "7");
  assert.equal(formatUnreadBadge("12"), "12");
  assert.equal(formatUnreadBadge(99), "99");
});

test("caps at 99+", () => {
  assert.equal(formatUnreadBadge(100), "99+");
  assert.equal(formatUnreadBadge(5000), "99+");
  assert.equal(formatUnreadBadge(10, 9), "9+");
});
