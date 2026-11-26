import test from "node:test";
import assert from "node:assert/strict";

import {
  filterTranscriptMessages,
  hasSpeechFilter,
  isSpeechFilterShortcut,
  normalizeSpeechFilters,
} from "../src/utils/speechFilters.js";

const players = {
  p1: { id: "p1", name: "Alice" },
  p2: { id: "p2", name: "Bob" },
  p3: { id: "p3", name: "Bobby" },
};
const spectators = {
  s1: { id: "s1", name: "Watcher" },
};

const messages = [
  { id: "m1", senderId: "p1", content: "I am the cop" },
  { id: "m2", senderId: "p2", content: "Alice is lying" },
  { id: "m3", senderId: "p3", content: "I believe Bob" },
  { id: "m4", senderId: "s1", content: "watching the cop claim" },
  { id: "m5", senderId: "server", content: "Alice has been lynched." },
];

function ids(filtered) {
  return filtered.map((message) => message.id);
}

test("no filter returns the same array", () => {
  assert.equal(filterTranscriptMessages(messages, players, spectators), messages);
});

test("an empty filter does not narrow the transcript", () => {
  const filters = { from: "", contains: "  " };
  assert.equal(hasSpeechFilter(filters), false);
  assert.equal(
    filterTranscriptMessages(messages, players, spectators, filters),
    messages
  );
});

test("from matches a full player name, case-insensitively", () => {
  const filtered = filterTranscriptMessages(
    messages,
    players,
    spectators,
    { from: "alice", contains: "" }
  );
  assert.deepEqual(ids(filtered), ["m1", "m5"]);
});

test("from does not match a name substring", () => {
  const filtered = filterTranscriptMessages(
    messages,
    players,
    spectators,
    { from: "Bob", contains: "" }
  );
  assert.deepEqual(ids(filtered), ["m2", "m5"]);
});

test("from can target a spectator", () => {
  const filtered = filterTranscriptMessages(
    messages,
    players,
    spectators,
    { from: "Watcher", contains: "" }
  );
  assert.deepEqual(ids(filtered), ["m4", "m5"]);
});

test("contains matches message text, case-insensitively", () => {
  const filtered = filterTranscriptMessages(
    messages,
    players,
    spectators,
    { from: "", contains: "COP" }
  );
  assert.deepEqual(ids(filtered), ["m1", "m4", "m5"]);
});

test("from and contains both have to match", () => {
  const filtered = filterTranscriptMessages(
    messages,
    players,
    spectators,
    { from: "Alice", contains: "lying" }
  );
  assert.deepEqual(ids(filtered), ["m5"]);
});

test("server rows are kept so the game log stays readable", () => {
  const filtered = filterTranscriptMessages(
    messages,
    players,
    spectators,
    { from: "Bob", contains: "" }
  );
  assert.ok(filtered.some((message) => message.id === "m5"));
});

test("a quote is judged by the message it shows, not the quoter", () => {
  const history = {
    states: {
      1: {
        meetings: {
          village: {
            messages: [
              { id: "m1", senderId: "p1", content: "I am the cop" },
              {
                id: "q1",
                isQuote: true,
                senderId: "p2",
                messageId: "m1",
                fromMeetingId: "village",
                fromState: 1,
              },
            ],
          },
        },
      },
    },
  };
  const meetingMessages = history.states[1].meetings.village.messages;

  assert.deepEqual(
    ids(
      filterTranscriptMessages(
        meetingMessages,
        players,
        spectators,
        { from: "Alice", contains: "" },
        history
      )
    ),
    ["m1", "q1"]
  );
  assert.deepEqual(
    ids(
      filterTranscriptMessages(
        meetingMessages,
        players,
        spectators,
        { from: "Bob", contains: "" },
        history
      )
    ),
    []
  );
  assert.deepEqual(
    ids(
      filterTranscriptMessages(
        meetingMessages,
        players,
        spectators,
        { from: "", contains: "cop" },
        history
      )
    ),
    ["m1", "q1"]
  );
});

test("an unresolved quote is kept", () => {
  const history = { states: { 1: { meetings: {} } } };
  const quote = {
    id: "q1",
    isQuote: true,
    senderId: "p2",
    messageId: "missing",
    fromMeetingId: "village",
    fromState: 1,
  };
  assert.deepEqual(
    ids(
      filterTranscriptMessages(
        [quote],
        players,
        spectators,
        { from: "Alice", contains: "" },
        history
      )
    ),
    ["q1"]
  );
});

test("missing filters and maps do not throw", () => {
  assert.equal(normalizeSpeechFilters(undefined).from, "");
  assert.equal(filterTranscriptMessages(messages, undefined, undefined).length, messages.length);
});

test("Ctrl+F and Cmd+F are the speech filter shortcut", () => {
  assert.equal(
    isSpeechFilterShortcut({ key: "f", ctrlKey: true }),
    true
  );
  assert.equal(
    isSpeechFilterShortcut({ key: "F", metaKey: true }),
    true
  );
});

test("plain F and unrelated shortcuts are not captured", () => {
  assert.equal(isSpeechFilterShortcut({ key: "f" }), false);
  assert.equal(
    isSpeechFilterShortcut({ key: "f", ctrlKey: true, shiftKey: true }),
    false
  );
  assert.equal(
    isSpeechFilterShortcut({ key: "f", ctrlKey: true, altKey: true }),
    false
  );
  assert.equal(
    isSpeechFilterShortcut({ key: "g", ctrlKey: true }),
    false
  );
  assert.equal(isSpeechFilterShortcut(undefined), false);
});
