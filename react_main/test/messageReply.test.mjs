import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReplyPayload,
  canReplyTo,
  describeQuotedMessage,
  findMessageRow,
  handleGameEscape,
  hasSelectionIn,
  isDrag,
  isReplyClick,
  isTypingKey,
  redirectTypingToChat,
  REPLY_CLICK_MOVE_PX,
  makeReplyTarget,
  REPLY_CLICK_DELAY_MS,
  REPLY_CLICK_IGNORE_SELECTOR,
  pairReplies,
  showPinButton,
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
  assert.equal(
    buildReplyPayload(target, { meetingId: "m", content: "/roll" }),
    null
  );
  assert.equal(
    buildReplyPayload(target, {
      meetingId: "m",
      content: "hi",
      abilityName: "Whisper",
    }),
    null
  );
  assert.equal(
    buildReplyPayload(target, { meetingId: "m", content: "" }),
    null
  );
  assert.equal(
    buildReplyPayload(null, { meetingId: "m", content: "hi" }),
    null
  );
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
  const e = {
    key,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
  handleGameEscape(e, {
    replyPending,
    cancelReply: () => calls.push("cancelReply"),
    leave: () => calls.push("leave"),
  });
  return { calls, prevented: e.defaultPrevented };
}

test("Escape with a reply pending cancels it and does not open the leave dialog", () => {
  assert.deepEqual(escapeRun("Escape", true), {
    calls: ["cancelReply"],
    prevented: true,
  });
});

test("Escape with no reply pending still asks to leave", () => {
  assert.deepEqual(escapeRun("Escape", false), {
    calls: ["leave"],
    prevented: false,
  });
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
      cancelReply: () => {
        calls.push("cancelReply");
        reply = null;
      },
      leave: () => calls.push("leave"),
    })
  );
  const press = () => {
    const ev = new Event("keydown");
    ev.key = "Escape";
    target.dispatchEvent(ev);
  };
  press();
  assert.deepEqual(calls, ["cancelReply"]);
  assert.equal(reply, null);
  press();
  assert.deepEqual(calls, ["cancelReply", "leave"]);
});

// The pin rule as it is on master, before the reply button existed.
function masterShowsPin({ review, isQuote, isHovering, stateViewing }) {
  return !review && !isQuote && isHovering && stateViewing >= 0;
}

test("the pin shows exactly where master shows it", () => {
  for (const review of [false, true])
    for (const isQuote of [false, true])
      for (const isHovering of [false, true])
        for (const stateViewing of [-2, -1, 0, 1, 2]) {
          const row = { review, isQuote, isHovering, stateViewing };
          assert.equal(
            showPinButton(row),
            masterShowsPin(row),
            JSON.stringify(row)
          );
        }
});

test("a row that can be replied to still shows its pin once the game starts", () => {
  for (const stateViewing of [0, 1, 2]) {
    const view = { review: false, stateViewing };
    assert.equal(canReplyTo(claim, view), true);
    assert.equal(
      showPinButton({ ...view, isQuote: false, isHovering: true }),
      true
    );
  }
});

test("pregame offers reply but no pin, as master has no pin there", () => {
  const view = { review: false, stateViewing: -1 };
  assert.equal(canReplyTo(claim, view), true);
  assert.equal(
    showPinButton({ ...view, isQuote: false, isHovering: true }),
    false
  );
});

const quote = {
  id: "quoteQ1",
  isQuote: true,
  senderId: "playerB",
  meetingId: "village1",
  messageId: claim.id,
  fromMeetingId: "village1",
  fromState: 1,
};
const reply = {
  id: "replyR1",
  senderId: "playerB",
  meetingId: "village1",
  content: "yo im replying to this",
  replyTo: quote.id,
};
const other = {
  id: "otherO1",
  senderId: "playerC",
  meetingId: "village1",
  content: "hi",
};

test("a reply right under its quote becomes one row carrying the quote", () => {
  const rows = pairReplies([other, quote, reply, other]);
  assert.equal(rows.length, 3);
  assert.equal(rows[1].message, reply);
  assert.equal(rows[1].replyQuote, quote);
  assert.equal(rows[1].replyMerged, true);
  assert.equal(rows[0].replyQuote, undefined);
  assert.equal(rows[2].replyQuote, undefined);
});

test("a quote whose reply has not arrived yet is drawn on its own", () => {
  const rows = pairReplies([other, quote]);
  assert.deepEqual(rows, [{ message: other }, { message: quote }]);
});

test("a reply whose quote is not directly above keeps its own row", () => {
  // It still carries its quote, so it can show what it answers; the quote
  // keeps its row too.
  const rows = pairReplies([quote, other, reply]);
  assert.deepEqual(rows, [
    { message: quote },
    { message: other },
    { message: reply, replyQuote: quote, replyMerged: false },
  ]);
  // Without its quote in the list it is drawn as before.
  assert.deepEqual(pairReplies([other, reply]), [
    { message: other },
    { message: reply },
  ]);
  // A quote from someone else with the same id does not count.
  assert.deepEqual(pairReplies([{ ...quote, senderId: "playerC" }, other, reply])[2], {
    message: reply,
  });
});

test("plain quotes and quotes from someone else are not merged", () => {
  const plain = { ...other, senderId: "playerB" };
  assert.equal(pairReplies([quote, plain]).length, 2);
  const otherSender = { ...reply, senderId: "playerC" };
  assert.equal(pairReplies([quote, otherSender]).length, 2);
  const otherMeeting = { ...reply, meetingId: "mafia1" };
  assert.equal(pairReplies([quote, otherMeeting]).length, 2);
  // A second line after the merged reply is drawn normally.
  const rows = pairReplies([quote, reply, { ...reply, id: "r2" }]);
  assert.equal(rows.length, 2);
});

test("anonymous replies pair by id and name the quoted sender Anonymous", () => {
  const anonQuote = { ...quote, senderId: "anonymous" };
  const anonReply = { ...reply, senderId: "anonymous" };
  const rows = pairReplies([anonQuote, anonReply]);
  assert.equal(rows.length, 1);
  const state = {
    name: "Day 1",
    meetings: {
      village1: {
        name: "Village",
        messages: [{ ...claim, senderId: "anonymous", time: 5 }],
      },
    },
  };
  const players = { anonymous: { name: "should not show" } };
  const described = describeQuotedMessage(anonQuote, state, players, undefined);
  assert.equal(described.senderName, "Anonymous");
  // No player to draw: the reference uses the anonymous avatar.
  assert.equal(described.sender, undefined);
});

test("the reply preview names the quoted sender, state and text", () => {
  const state = {
    name: "Pregame",
    meetings: {
      village1: { name: "Village", messages: [{ ...claim, time: 9 }] },
    },
  };
  const players = { playerA: { name: "AlageRheba10" } };
  assert.deepEqual(describeQuotedMessage(quote, state, players, {}), {
    messageId: claim.id,
    senderName: "AlageRheba10",
    sender: players.playerA,
    nameColor: undefined,
    fromStateName: "Pregame",
    meetingName: "Village",
    content: claim.content,
    time: 9,
    customEmotes: undefined,
    customStickers: undefined,
  });
  // Spectators are found too; a missing state or line gives null.
  assert.equal(
    describeQuotedMessage(quote, state, {}, { playerA: { name: "Spec" } })
      .senderName,
    "Spec"
  );
  assert.equal(describeQuotedMessage(quote, undefined, players, {}), null);
  assert.equal(
    describeQuotedMessage({ ...quote, messageId: "nope" }, state, players, {}),
    null
  );
});

test("findMessageRow finds the original line in the same chat only", () => {
  const row = (id) => ({ dataset: { messageId: id } });
  const original = row("m1");
  const chat = { querySelectorAll: () => [row("m0"), original] };
  const reply = { closest: () => chat, parentElement: chat };
  assert.equal(findMessageRow(reply, "m1"), original);
  assert.equal(findMessageRow(reply, "missing"), null);
  assert.equal(findMessageRow(null, "m1"), null);
  assert.equal(findMessageRow(reply, undefined), null);
});

// Click to reply. A tiny DOM stand-in: elements with a parent, the classes
// or tags they match, and an optional cursor.
function el(
  name,
  parent,
  { matches = [], cursor = "auto", classes = [], inline = "" } = {},
) {
  const node = {
    name,
    parentElement: parent || null,
    cursor,
    style: { cursor: inline },
    classList: { contains: (c) => classes.includes(c) },
    matches: (selector) =>
      matches.some((m) => selector.split(", ").includes(m)),
    contains(other) {
      for (let n = other; n; n = n.parentElement) if (n === node) return true;
      return false;
    },
  };
  return node;
}
const env = (extra = {}) => ({
  getComputedStyle: (n) => ({ cursor: n.cursor }),
  selection: null,
  ...extra,
});
const row = el("row");
const content = el("content", row);
const text = el("text", content);
const click = (target, extra = {}) => ({ button: 0, detail: 1, target, ...extra });

test("the reply delay is short enough to feel instant and leaves room for a double-click", () => {
  assert.equal(REPLY_CLICK_DELAY_MS, 250);
});

test("a plain click on a row's text or empty space starts a reply", () => {
  assert.equal(isReplyClick(click(text), row, env()), true);
  assert.equal(isReplyClick(click(row), row, env()), true);
});

test("the second click of a double-click never starts a reply", () => {
  assert.equal(isReplyClick(click(text, { detail: 2 }), row, env()), false);
  assert.equal(isReplyClick(click(text, { detail: 3 }), row, env()), false);
});

test("right, middle and modified clicks do not start a reply", () => {
  assert.equal(isReplyClick(click(text, { button: 1 }), row, env()), false);
  assert.equal(isReplyClick(click(text, { shiftKey: true }), row, env()), false);
  assert.equal(isReplyClick(click(text, { ctrlKey: true }), row, env()), false);
  assert.equal(isReplyClick(click(text, { metaKey: true }), row, env()), false);
});

test("clicks on links, names, avatars, emotes, stickers, the pin and the reference do not reply", () => {
  for (const m of [
    "a",
    "img",
    ".name-with-avatar",
    ".avatar",
    ".user-name",
    ".emote",
    ".sticker",
    ".role",
    ".pin-button-wrapper",
    ".reply-reference",
    "[role='button']",
  ]) {
    assert.ok(REPLY_CLICK_IGNORE_SELECTOR.split(", ").includes(m), m);
    const inner = el("inner", el("wrap", content, { matches: [m] }));
    assert.equal(isReplyClick(click(inner), row, env()), false, m);
  }
});

test("a part with its own pointer cursor (a spoiler) does not reply", () => {
  const spoiler = el("spoiler", content, { cursor: "pointer" });
  assert.equal(isReplyClick(click(el("t", spoiler)), row, env()), false);
  // Inside text that is already a pointer (a quotable line), a spoiler sets
  // its pointer inline.
  const body = el("body", row, { cursor: "pointer", classes: ["content"] });
  const words = el("words", body, { cursor: "pointer" });
  assert.equal(isReplyClick(click(words), row, env()), true);
  const inline = el("inline", body, { cursor: "pointer", inline: "pointer" });
  assert.equal(isReplyClick(click(el("t", inline)), row, env()), false);
});

test("a role mention (it opens a popover) does not reply", () => {
  const mention = el("mention", content, { matches: ["[aria-haspopup]"] });
  assert.equal(isReplyClick(click(mention), row, env()), false);
});

test("a click bubbled from a popover outside the row does not reply", () => {
  const popover = el("popover", el("body"));
  assert.equal(isReplyClick(click(popover), row, env()), false);
});

test("a click that ends a text selection in the row does not reply", () => {
  const selection = {
    isCollapsed: false,
    anchorNode: text,
    focusNode: text,
    toString: () => "cop",
  };
  assert.equal(hasSelectionIn(row, selection), true);
  assert.equal(isReplyClick(click(text), row, env({ selection })), false);
});

test("an empty or elsewhere selection does not block a reply", () => {
  const collapsed = { isCollapsed: true, anchorNode: text, focusNode: text, toString: () => "" };
  assert.equal(isReplyClick(click(text), row, env({ selection: collapsed })), true);
  const other = el("other");
  const elsewhere = { isCollapsed: false, anchorNode: other, focusNode: other, toString: () => "hi" };
  assert.equal(isReplyClick(click(text), row, env({ selection: elsewhere })), true);
});

test("a press that moves more than a few pixels before the click is a drag, not a reply", () => {
  assert.equal(REPLY_CLICK_MOVE_PX, 4);
  const down = { x: 100, y: 50 };
  assert.equal(isDrag(down, { clientX: 103, clientY: 52 }), false);
  assert.equal(isDrag(down, { clientX: 150, clientY: 50 }), true);
  assert.equal(isDrag(null, { clientX: 150, clientY: 50 }), false);
  const at = (x, y) => click(text, { clientX: x, clientY: y });
  assert.equal(isReplyClick(at(150, 50), row, env({ pointerDown: down })), false);
  assert.equal(isReplyClick(at(101, 51), row, env({ pointerDown: down })), true);
});

test("only typing keys jump to the chat box; Tab, Enter, arrows and shortcuts do not", () => {
  for (const key of ["a", "Z", "1", " ", "?", "Backspace"])
    assert.equal(isTypingKey({ key }), true, key);
  for (const key of ["Tab", "Enter", "Escape", "ArrowUp", "Shift", "F5"])
    assert.equal(isTypingKey({ key }), false, key);
  assert.equal(isTypingKey({ key: "c", ctrlKey: true }), false);
  assert.equal(isTypingKey({ key: "c", metaKey: true }), false);
});

test("typing outside a text field moves focus to the chat box, Tab does not", () => {
  let focused = 0;
  const doc = (tag) => ({
    activeElement: { tagName: tag },
    getElementById: (id) => (id === "speechInput" ? { focus: () => focused++ } : null),
  });
  redirectTypingToChat({ key: "h" }, doc("DIV"));
  assert.equal(focused, 1);
  redirectTypingToChat({ key: "Tab" }, doc("DIV"));
  redirectTypingToChat({ key: "Enter" }, doc("DIV"));
  redirectTypingToChat({ key: "h" }, doc("INPUT"));
  assert.equal(focused, 1);
});
