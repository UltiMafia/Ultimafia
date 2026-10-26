import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReplyPayload,
  canReplyTo,
  makeReplyTarget,
} from "../src/utils/messageReply.js";

const claim = {
  id: "msgDay1abc",
  senderId: "playerA",
  meetingId: "village1",
  content: "I am the cop",
  quotable: true,
};

test("a reply sends the quote and the text to the same meeting", () => {
  const target = makeReplyTarget(claim, 1);
  assert.deepEqual(
    buildReplyPayload(target, { meetingId: "village3", content: "prove it" }),
    {
      quote: {
        messageId: "msgDay1abc",
        toMeetingId: "village3",
        fromMeetingId: "village1",
        fromState: 1,
        messageContent: "I am the cop",
      },
      message: { content: "prove it", meetingId: "village3" },
    }
  );
});

test("the state the message was shown in is kept, or its own stamp", () => {
  assert.equal(makeReplyTarget(claim, 2).fromState, 2);
  assert.equal(makeReplyTarget({ ...claim, fromState: "1" }, 3).fromState, "1");
});

test("commands, whispers and empty text are not replies", () => {
  const target = makeReplyTarget(claim, 1);
  assert.equal(buildReplyPayload(target, { meetingId: "m", content: "/roll" }), null);
  assert.equal(
    buildReplyPayload(target, { meetingId: "m", content: "hi", abilityName: "Whisper" }),
    null
  );
  assert.equal(buildReplyPayload(target, { meetingId: "m", content: "" }), null);
  assert.equal(buildReplyPayload(null, { meetingId: "m", content: "hi" }), null);
  assert.ok(buildReplyPayload(target, { meetingId: "m", content: "/me nods" }));
});

test("only quotable player messages can be replied to, pregame included", () => {
  const live = { review: false, stateViewing: 1 };
  assert.equal(canReplyTo(claim, live), true);
  assert.equal(canReplyTo(claim, { review: false, stateViewing: -1 }), true);
  assert.equal(canReplyTo({ ...claim, senderId: "anonymous" }, live), true);
  assert.equal(canReplyTo({ ...claim, senderId: "server" }, live), false);
  assert.equal(canReplyTo({ ...claim, senderId: "vote" }, live), false);
  assert.equal(canReplyTo({ ...claim, isQuote: true }, live), false);
  assert.equal(canReplyTo({ ...claim, quotable: false }, live), false);
  assert.equal(canReplyTo(claim, { review: true, stateViewing: 1 }), false);
  assert.equal(canReplyTo(claim, { review: false, stateViewing: -2 }), false);
});
