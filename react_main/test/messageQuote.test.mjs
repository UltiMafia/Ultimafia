import test from "node:test";
import assert from "node:assert/strict";
import {
  buildQuotePayload,
  findMessageState,
} from "../src/utils/messageQuote.js";

const day1Claim = {
  id: "msgDay1abc",
  senderId: "playerA",
  meetingId: "village1",
  content: "I am the cop",
  quotable: true,
  time: 1000,
};

const history = {
  currentState: 3,
  states: {
    "-1": { meetings: { pregame: { messages: [] } } },
    1: { meetings: { village1: { messages: [day1Claim] } } },
    2: { meetings: { mafia2: { messages: [] } } },
    3: {
      meetings: {
        village3: {
          messages: [
            {
              id: "msgDay3xyz",
              senderId: "playerB",
              meetingId: "village3",
              content: "hi",
              quotable: true,
            },
          ],
        },
      },
    },
  },
};

test("a pinned day 1 message quoted on day 3 points at day 1, not the state on screen", () => {
  // The pinned list renders the stored copy with stateViewing = current state.
  const pinnedCopy = { ...day1Claim };
  const payload = buildQuotePayload(pinnedCopy, {
    review: false,
    toMeetingId: "village3",
    history,
    stateViewing: 3,
  });
  assert.deepEqual(payload, {
    messageId: "msgDay1abc",
    toMeetingId: "village3",
    fromMeetingId: "village1",
    fromState: "1",
    messageContent: "I am the cop",
  });
});

test("quoting from the main chat still uses the state the message is in", () => {
  const msg = history.states[3].meetings.village3.messages[0];
  const payload = buildQuotePayload(msg, {
    review: false,
    toMeetingId: "village3",
    history,
    stateViewing: 3,
  });
  assert.equal(payload.fromState, "3");
  assert.equal(payload.messageId, "msgDay3xyz");
});

test("falls back to the message's own state stamp, then the viewed state", () => {
  const unknown = { id: "gone12345", meetingId: "old", quotable: true };
  assert.equal(findMessageState(history, { ...unknown, fromState: "2" }, 3), "2");
  assert.equal(findMessageState(history, unknown, 3), 3);
});

test("server lines, quotes, unquotable messages and review mode give no payload", () => {
  const opts = { review: false, toMeetingId: "v", history, stateViewing: 3 };
  assert.equal(buildQuotePayload({ ...day1Claim, senderId: "server" }, opts), null);
  assert.equal(buildQuotePayload({ ...day1Claim, isQuote: true }, opts), null);
  assert.equal(buildQuotePayload({ ...day1Claim, quotable: false }, opts), null);
  assert.equal(buildQuotePayload(day1Claim, { ...opts, review: true }), null);
});
