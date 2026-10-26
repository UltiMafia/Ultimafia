import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReplyPayload,
  canReplyTo,
  handleGameEscape,
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

function escapeRun(key, replyPending) {
  const calls = [];
  const e = { key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  handleGameEscape(e, {
    replyPending,
    cancelReply: () => calls.push("cancelReply"),
    leave: () => calls.push("leave"),
  });
  return { calls, prevented: e.defaultPrevented };
}

test("Escape with a reply pending cancels it and does not open the leave dialog", () => {
  assert.deepEqual(escapeRun("Escape", true), { calls: ["cancelReply"], prevented: true });
});

test("Escape with no reply pending still asks to leave", () => {
  assert.deepEqual(escapeRun("Escape", false), { calls: ["leave"], prevented: false });
});

test("other keys do nothing", () => {
  assert.deepEqual(escapeRun("Enter", true), { calls: [], prevented: false });
  assert.deepEqual(escapeRun("a", false), { calls: [], prevented: false });
});

test("one Escape press cancels the reply once, then the next press asks to leave", () => {
  // Mirrors the page: one window keydown listener reading the current reply.
  let reply = { message: claim, fromState: 1 };
  const calls = [];
  const target = new EventTarget();
  target.addEventListener("keydown", (e) =>
    handleGameEscape(e, {
      replyPending: Boolean(reply),
      cancelReply: () => { calls.push("cancelReply"); reply = null; },
      leave: () => calls.push("leave"),
    })
  );
  const press = () => { const ev = new Event("keydown"); ev.key = "Escape"; target.dispatchEvent(ev); };
  press();
  assert.deepEqual(calls, ["cancelReply"]);
  assert.equal(reply, null);
  press();
  assert.deepEqual(calls, ["cancelReply", "leave"]);
});
