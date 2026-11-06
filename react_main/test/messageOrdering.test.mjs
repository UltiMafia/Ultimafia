import test from "node:test";
import assert from "node:assert/strict";
import {
  insertBeforePending,
  removePending,
  replacePending,
} from "../src/utils/messageOrdering.js";

const msg = (id, pending = false) => ({ id, content: id, pending });

test("appends when nothing is waiting", () => {
  const list = [msg("a"), msg("b")];
  const next = insertBeforePending(list, msg("c"));

  assert.deepEqual(next.map((m) => m.id), ["a", "b", "c"]);
});

test("inserts before a waiting row", () => {
  const list = [msg("a"), msg("pending:1", true)];
  const next = insertBeforePending(list, msg("theirs"));

  assert.deepEqual(next.map((m) => m.id), ["a", "theirs", "pending:1"]);
});

test("inserts before several waiting rows", () => {
  const list = [msg("a"), msg("pending:1", true), msg("pending:2", true)];
  const next = insertBeforePending(list, msg("theirs"));

  assert.deepEqual(next.map((m) => m.id), [
    "a",
    "theirs",
    "pending:1",
    "pending:2",
  ]);
});

test("keeps a quote above a waiting row", () => {
  const list = [msg("a"), msg("pending:1", true)];
  const quote = { id: "quote:1", isQuote: true, pending: false };
  const next = insertBeforePending(list, quote);

  assert.deepEqual(next.map((m) => m.id), ["a", "quote:1", "pending:1"]);
});

test("does not move or drop anything else", () => {
  const list = [msg("a"), msg("b"), msg("pending:1", true)];
  const next = insertBeforePending(list, msg("c"));

  assert.equal(next.length, 4);
  assert.deepEqual(next.map((m) => m.id), [
    "a",
    "b",
    "c",
    "pending:1",
  ]);
});

test("does not mutate the list it is given", () => {
  const list = [msg("a"), msg("pending:1", true)];
  const before = list.map((m) => m.id);

  insertBeforePending(list, msg("b"));

  assert.deepEqual(list.map((m) => m.id), before);
});

test("tolerates a missing list", () => {
  assert.deepEqual(insertBeforePending(undefined, msg("a")).map((m) => m.id), [
    "a",
  ]);
  assert.deepEqual(insertBeforePending(null, msg("a")).map((m) => m.id), ["a"]);
});

test("treats a falsy trailing entry as a message, not a row", () => {
  const list = [msg("a"), null];
  const next = insertBeforePending(list, msg("b"));

  assert.deepEqual(next.map((m) => (m ? m.id : null)), ["a", null, "b"]);
});

test("a quote arriving while a row waits does not consume the row", () => {
  const list = [msg("a"), msg("pending:1", true)];
  const quote = { id: "quote:1", senderId: "them", content: "quoted", isQuote: true };
  const withQuote = insertBeforePending(list, quote);
  const replaced = replacePending(withQuote, quote);

  assert.equal(replaced, null);
  assert.deepEqual(withQuote.map((m) => m.id), ["a", "quote:1", "pending:1"]);
});

test("the echo replaces the row with the same sender and content", () => {
  const list = [
    msg("a"),
    { id: "pending:1", senderId: "me", content: "first", pending: true },
    { id: "pending:2", senderId: "me", content: "second", pending: true },
  ];
  const echo = { id: "srv:2", senderId: "me", content: " second " };

  const next = replacePending(list, echo);

  assert.deepEqual(next.map((m) => m.id), ["a", "pending:1", "srv:2"]);
  assert.equal(list[2].id, "pending:2", "input list is not mutated");
});

test("a different sender never confirms someone else's row", () => {
  const list = [{ id: "pending:1", senderId: "me", content: "hi", pending: true }];
  const echo = { id: "srv:1", senderId: "them", content: "hi" };

  assert.equal(replacePending(list, echo), null);
});

test("a rejected send removes its row and leaves the rest", () => {
  const list = [msg("a"), msg("pending:1", true), msg("b")];

  const next = removePending(list, "pending:1");

  assert.deepEqual(next.map((m) => m.id), ["a", "b"]);
  assert.equal(list.length, 3, "input list is not mutated");
});

test("removing a row that is gone is a no-op signal", () => {
  assert.equal(removePending([msg("a")], "pending:9"), null);
});
