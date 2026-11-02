import test from "node:test";
import assert from "node:assert/strict";
import { bindMessageTouch } from "../src/utils/messageTouch.js";

function fixture(canReply = true) {
  const row = new EventTarget();
  row.contains = (el) => el === row;
  const classes = new Set();
  row.classList = { add: (...cs) => cs.forEach((c) => classes.add(c)), remove: (...cs) => cs.forEach((c) => classes.delete(c)) };
  const styles = new Map();
  row.style = { setProperty: (k, v) => styles.set(k, v), removeProperty: (k) => styles.delete(k) };
  let replies = 0;
  let pins = 0;
  let timer;
  const cleanup = bindMessageTouch(row, {
    canReply,
    onReply: () => replies++,
    onPin: () => pins++,
    getSelection: () => null,
    setTimer: (fn) => { timer = fn; return 1; },
    clearTimer: () => { timer = undefined; },
  });
  const event = (name, x, y = 100, count = 1) => {
    const e = new Event(name, { cancelable: true });
    const point = { identifier: 7, clientX: x, clientY: y };
    Object.defineProperties(e, {
      touches: { value: name === "touchend" || name === "touchcancel" ? [] : Array.from({ length: count }, (_, i) => ({ ...point, identifier: 7 + i })) },
      changedTouches: { value: [point] },
    });
    row.dispatchEvent(e);
    return e;
  };
  return { event, cleanup, classes, styles, hold: () => timer?.(), replies: () => replies, pins: () => pins };
}

test("left swipe replies once, only after release beyond 64px", () => {
  assert.equal(typeof bindMessageTouch, "function", "mobile message touch binding is missing");
  const f = fixture();
  f.event("touchstart", 240);
  f.event("touchmove", 150);
  assert.equal(f.replies(), 0);
  assert.ok(f.classes.has("reply-swipe-ready"));
  assert.equal(f.event("touchmove", 145).defaultPrevented, true);
  f.event("touchend", 145);
  f.event("touchend", 145);
  assert.equal(f.replies(), 1);
  assert.equal(f.pins(), 0);
  assert.equal(f.classes.size, 0);
});

for (const [name, dx, dy] of [["short", -63, 0], ["right", 70, 0], ["vertical", -20, 90]]) {
  test(`${name} movement neither replies nor pins`, () => {
    const f = fixture();
    f.event("touchstart", 240);
    const move = f.event("touchmove", 240 + dx, 100 + dy);
    if (name !== "short") assert.equal(move.defaultPrevented, false);
    f.hold();
    f.event("touchend", 240 + dx, 100 + dy);
    assert.equal(f.replies(), 0);
    assert.equal(f.pins(), 0);
  });
}

test("returning below the threshold disarms the swipe", () => {
  const f = fixture();
  f.event("touchstart", 240);
  f.event("touchmove", 150);
  f.event("touchmove", 220);
  assert.ok(!f.classes.has("reply-swipe-ready"));
  f.event("touchend", 220);
  assert.equal(f.replies(), 0);
});

test("release coordinates decide eligibility, including the exact threshold", () => {
  for (const [x, expected] of [[176, 1], [177, 0]]) {
    const f = fixture();
    f.event("touchstart", 240);
    f.event("touchmove", 150);
    f.event("touchend", x);
    assert.equal(f.replies(), expected);
  }
});

test("vertical intent cannot become a reply later in the same touch", () => {
  const f = fixture();
  f.event("touchstart", 240);
  f.event("touchmove", 230, 120);
  f.event("touchmove", 140, 120);
  f.event("touchend", 140, 120);
  assert.equal(f.replies(), 0);
});

for (const type of ["touchcancel", "multitouch", "unmount"]) {
  test(`${type} resets the swipe and cancels the pin timer`, () => {
    const f = fixture();
    f.event("touchstart", 240);
    f.event("touchmove", 150);
    if (type === "touchcancel") f.event("touchcancel", 150);
    if (type === "multitouch") f.event("touchstart", 150, 100, 2);
    if (type === "unmount") f.cleanup();
    f.hold();
    f.event("touchend", 150);
    assert.equal(f.replies(), 0);
    assert.equal(f.pins(), 0);
    assert.equal(f.classes.size, 0);
    assert.equal(f.styles.size, 0);
  });
}

test("stationary long press pins once and cannot subsequently swipe-reply", () => {
  const f = fixture();
  f.event("touchstart", 240);
  f.hold();
  f.event("touchmove", 150);
  f.event("touchend", 150);
  assert.equal(f.pins(), 1);
  assert.equal(f.replies(), 0);
});

test("a tap does nothing; a little jitter does not cancel long press", () => {
  const f = fixture();
  f.event("touchstart", 240);
  f.event("touchend", 240);
  f.hold();
  assert.equal(f.pins(), 0);
  f.event("touchstart", 240);
  f.event("touchmove", 238, 102);
  f.hold();
  assert.equal(f.pins(), 1);
  assert.equal(f.replies(), 0);
});

test("a non-replyable row keeps scrolling and never replies", () => {
  const f = fixture(false);
  f.event("touchstart", 240);
  assert.equal(f.event("touchmove", 150).defaultPrevented, false);
  f.event("touchend", 150);
  assert.equal(f.replies(), 0);
});
