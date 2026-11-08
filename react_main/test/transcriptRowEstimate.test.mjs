import test from "node:test";
import assert from "node:assert/strict";
import { estimateTranscriptRowHeight } from "../src/utils/transcriptRowEstimate.js";

const iOS_FLOOR = 150;

test("keeps the platform floor for a short row", () => {
  assert.equal(estimateTranscriptRowHeight({ content: "gg" }, iOS_FLOOR), iOS_FLOOR);
});

test("grows with a tall multiline row", () => {
  // 210 characters in 15 lines: legal chat content, well under the 240 limit.
  const content = "A short line.\n".repeat(15);
  const estimate = estimateTranscriptRowHeight({ content }, iOS_FLOOR);
  assert.ok(estimate > iOS_FLOOR, `expected above the floor, got ${estimate}`);
  assert.ok(estimate >= 15 * 20, `expected at least one line per newline, got ${estimate}`);
});

test("grows with a long single line", () => {
  const content = "x".repeat(240);
  assert.ok(estimateTranscriptRowHeight({ content }, 60) > 60);
});

test("adds a line for a quoted row", () => {
  // Long enough that the floor does not swallow the extra line.
  const content = "A short line.\n".repeat(10);
  const plain = estimateTranscriptRowHeight({ content }, 60);
  const quote = estimateTranscriptRowHeight({ content, isQuote: true }, 60);
  const reply = estimateTranscriptRowHeight({ content, replyTo: "x" }, 60);
  assert.ok(quote > plain);
  assert.equal(quote, reply);
});

test("falls back to the floor for rows without text", () => {
  assert.equal(estimateTranscriptRowHeight({ winners: ["a"] }, 60), 60);
  assert.equal(estimateTranscriptRowHeight(null, 60), 60);
  assert.equal(estimateTranscriptRowHeight({ content: 42 }, 60), 60);
});

test("caps a pathological row", () => {
  const content = "x".repeat(20000);
  assert.equal(estimateTranscriptRowHeight({ content }, 60), 1200);
});

test("reads the message off a rendered row element", () => {
  // WindowedTranscript receives <Message> elements, not raw message objects.
  const content = "A short line.\n".repeat(15);
  const element = { props: { message: { content } }, key: "row-1" };
  assert.equal(
    estimateTranscriptRowHeight(element, 150),
    estimateTranscriptRowHeight({ content }, 150)
  );
  assert.ok(estimateTranscriptRowHeight(element, 150) > 150);
});

test("a row element without a message keeps the floor", () => {
  assert.equal(estimateTranscriptRowHeight({ props: {}, key: "x" }, 150), 150);
});

test("follows the rendered layout instead of fixed metrics", () => {
  const content = "A short line.\n".repeat(15);
  const small = { lineHeight: 24, charsPerLine: 45, chrome: 18 };
  const large = { lineHeight: 36, charsPerLine: 30, chrome: 26 };

  const smallEstimate = estimateTranscriptRowHeight({ content }, 150, small);
  const largeEstimate = estimateTranscriptRowHeight({ content }, 150, large);

  assert.ok(largeEstimate > smallEstimate, `${largeEstimate} should exceed ${smallEstimate}`);
  assert.ok(largeEstimate >= 16 * 36, `expected one line per newline at the larger line height, got ${largeEstimate}`);
});

test("ignores a null layout and keeps the constants", () => {
  const content = "A short line.\n".repeat(15);
  assert.equal(
    estimateTranscriptRowHeight({ content }, 150, null),
    estimateTranscriptRowHeight({ content }, 150)
  );
});
