import assert from "node:assert/strict";
import test from "node:test";
import { newestRepliesFirst } from "../src/pages/Community/Forums/recentActivity.mjs";

test("latest forum activity uses dates, not oldest-first API order", () => {
  const replies = [{ id: "old", postDate: 100 }, { id: "new", postDate: 300 }, { id: "middle", postDate: 200 }];
  assert.deepEqual(newestRepliesFirst(replies).map(reply => reply.id), ["new", "middle", "old"]);
  assert.deepEqual(replies.map(reply => reply.id), ["old", "new", "middle"]);
  assert.deepEqual(newestRepliesFirst([]), []);
});
