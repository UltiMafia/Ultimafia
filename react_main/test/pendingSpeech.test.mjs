import assert from "node:assert/strict";
import test from "node:test";

import {
  confirmsPending,
  draftAfterRestore,
} from "../src/utils/pendingSpeech.js";

test("hands a refused line back when the box is empty", () => {
  assert.equal(draftAfterRestore("", "gg wp"), "gg wp");
});

test("keeps the next line when one is already being typed", () => {
  // The refusal of line N arrives while line N+1 is half-typed.
  assert.equal(draftAfterRestore("who was the", "gg wp"), "who was the");
});

test("treats a missing draft as empty", () => {
  assert.equal(draftAfterRestore(undefined, "gg wp"), "gg wp");
  assert.equal(draftAfterRestore(null, "gg wp"), "gg wp");
});

test("restoring nothing is empty, not undefined", () => {
  assert.equal(draftAfterRestore("", undefined), "");
  assert.equal(draftAfterRestore("", null), "");
});

test("a server copy confirms the pending row with the same text", () => {
  assert.equal(
    confirmsPending(
      { meetingId: "main", content: "gg wp" },
      { meetingId: "main", content: "gg wp" }
    ),
    true
  );
});

test("trimming differences still confirm", () => {
  assert.equal(
    confirmsPending(
      { meetingId: "main", content: "  gg wp " },
      { meetingId: "main", content: "gg wp" }
    ),
    true
  );
});

test("a message in another meeting does not confirm the row", () => {
  assert.equal(
    confirmsPending(
      { meetingId: "main", content: "gg wp" },
      { meetingId: "vip", content: "gg wp" }
    ),
    false
  );
});

test("different text does not confirm the row", () => {
  assert.equal(
    confirmsPending(
      { meetingId: "main", content: "gg wp" },
      { meetingId: "main", content: "gg" }
    ),
    false
  );
});

test("missing entries or messages never confirm", () => {
  assert.equal(confirmsPending(null, { meetingId: "main" }), false);
  assert.equal(confirmsPending({ meetingId: "main" }, null), false);
});
