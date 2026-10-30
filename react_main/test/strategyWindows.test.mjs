import test from "node:test";
import assert from "node:assert/strict";

import {
  bringToFront,
  cascadePos,
  clampWindowPos,
  clampWindowSize,
  defaultWindowSize,
  loadStrategyWindows,
  openWindow,
  renderOrder,
  saveStrategyWindows,
  stackRank,
  windowTitle,
  STRATEGY_WINDOWS_STORAGE_KEY,
  STRATEGY_WINDOW_MIN_HEIGHT,
  STRATEGY_WINDOW_MIN_WIDTH,
} from "../src/utils/strategyWindow.js";

const VIEWPORT = { width: 1440, height: 900 };

function fakeStorage(initial) {
  const data = new Map(Object.entries(initial || {}));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    dump: () => Object.fromEntries(data),
  };
}

test("a dragged window stays fully on screen", () => {
  const size = { width: 400, height: 500 };

  assert.deepEqual(clampWindowPos({ x: -50, y: -50 }, size, VIEWPORT), {
    x: 4,
    y: 4,
  });
  assert.deepEqual(clampWindowPos({ x: 5000, y: 5000 }, size, VIEWPORT), {
    x: VIEWPORT.width - 400 - 4,
    y: VIEWPORT.height - 500 - 4,
  });
  assert.deepEqual(clampWindowPos({ x: 120, y: 80 }, size, VIEWPORT), {
    x: 120,
    y: 80,
  });
});

test("a resized window stays between the minimum size and the viewport", () => {
  const tiny = clampWindowSize({ width: 10, height: 10 }, VIEWPORT);
  assert.equal(tiny.width, STRATEGY_WINDOW_MIN_WIDTH);
  assert.equal(tiny.height, STRATEGY_WINDOW_MIN_HEIGHT);

  const huge = clampWindowSize({ width: 99999, height: 99999 }, VIEWPORT);
  assert.equal(huge.width, VIEWPORT.width - 8);
  assert.equal(huge.height, VIEWPORT.height - 8);

  assert.deepEqual(clampWindowSize({ width: 500, height: 400 }, VIEWPORT), {
    width: 500,
    height: 400,
  });
});

test("a small screen never gets a window larger than itself", () => {
  const phone = { width: 390, height: 700 };
  const size = defaultWindowSize(phone);
  assert.ok(size.width <= phone.width);
  assert.ok(size.height <= phone.height);
  assert.ok(size.width >= STRATEGY_WINDOW_MIN_WIDTH);
});

test("new windows cascade instead of stacking exactly", () => {
  const size = { width: 400, height: 460 };
  const first = cascadePos(0, VIEWPORT, size);
  const second = cascadePos(1, VIEWPORT, size);
  assert.ok(second.x > first.x);
  assert.ok(second.y > first.y);

  // ...but a cascade never runs off the edge.
  const wrapped = cascadePos(7, { width: 500, height: 400 }, size);
  assert.ok(wrapped.x >= 4);
  assert.ok(wrapped.y >= 4);
});

test("opening the same setup twice focuses the window that is already open", () => {
  const first = openWindow([], "abc", VIEWPORT, { title: "Open Roles" });
  assert.equal(first.opened, true);
  assert.equal(first.windows.length, 1);
  assert.equal(first.windows[0].title, "Open Roles");
  assert.equal(first.windows[0].seq, 1);

  const second = openWindow(first.windows, "abc", VIEWPORT);
  assert.equal(second.opened, false);
  assert.equal(second.focused, true);
  assert.equal(second.windows.length, 1);
  assert.equal(second.id, first.id);

  const third = openWindow(second.windows, "def", VIEWPORT);
  assert.equal(third.opened, true);
  assert.equal(third.windows.length, 2);
  // The newest window is on top: it is last in the stack.
  assert.equal(third.windows[third.windows.length - 1].setupId, "def");
  // ...and creation order keeps counting, so it renders after the first one.
  assert.equal(third.windows[third.windows.length - 1].seq, 2);
});

test("a window without a setup id is not opened", () => {
  assert.equal(openWindow([], null, VIEWPORT).opened, false);
  assert.equal(openWindow([], "", VIEWPORT).windows.length, 0);
});

test("clicking a window brings it to the top of the stack", () => {
  const a = { id: "a", seq: 1 };
  const b = { id: "b", seq: 2 };
  const c = { id: "c", seq: 3 };

  const raised = bringToFront([a, b, c], "a");
  assert.deepEqual(raised.map((w) => w.id), ["b", "c", "a"]);
  // The stack moved, the render order did not: a click that raises a window
  // must not move it in the DOM under the pointer.
  assert.deepEqual(renderOrder(raised).map((w) => w.id), ["a", "b", "c"]);
  assert.equal(stackRank(raised, "a"), 2);
  assert.equal(stackRank(raised, "b"), 0);

  // Already on top: the stack is untouched (same order, no churn).
  assert.deepEqual(bringToFront([a, b, c], "c").map((w) => w.id), ["a", "b", "c"]);
  assert.deepEqual(bringToFront([a, b], "missing").map((w) => w.id), ["a", "b"]);
});

test("open windows survive a reload with their geometry", () => {
  const storage = fakeStorage();
  const windows = [
    { id: "w1", seq: 1, setupId: "abc", title: "Open Roles", x: 120, y: 60, width: 460, height: 380, collapsed: false },
    { id: "w2", seq: 2, setupId: "def", title: "", x: 300, y: 200, width: 400, height: 300, collapsed: true },
  ];

  saveStrategyWindows(storage, windows);
  assert.ok(storage.dump()[STRATEGY_WINDOWS_STORAGE_KEY]);

  const restored = loadStrategyWindows(storage, VIEWPORT);
  assert.equal(restored.length, 2);
  assert.deepEqual(restored[0], windows[0]);
  assert.deepEqual(restored[1], windows[1]);

  // The last window saved is the one on top before the reload.
  assert.equal(restored[1].setupId, "def");
});

test("a stacked window stays on top across a reload", () => {
  const storage = fakeStorage();
  const windows = [
    { id: "w1", seq: 1, setupId: "abc", x: 100, y: 100, width: 400, height: 400 },
    { id: "w2", seq: 2, setupId: "def", x: 200, y: 200, width: 400, height: 400 },
  ];
  saveStrategyWindows(storage, bringToFront(windows, "w1"));
  const restored = loadStrategyWindows(storage, VIEWPORT);
  assert.deepEqual(restored.map((w) => w.setupId), ["def", "abc"]);
  // Still rendered in creation order.
  assert.deepEqual(renderOrder(restored).map((w) => w.setupId), ["abc", "def"]);
});

test("closing every window clears the stored stack", () => {
  const storage = fakeStorage();
  saveStrategyWindows(storage, [
    { id: "w1", seq: 1, setupId: "abc", x: 0, y: 0, width: 400, height: 400 },
  ]);
  saveStrategyWindows(storage, []);
  assert.equal(storage.dump()[STRATEGY_WINDOWS_STORAGE_KEY], undefined);
  assert.deepEqual(loadStrategyWindows(storage, VIEWPORT), []);
});

test("unreadable or duplicated stored windows are dropped", () => {
  assert.deepEqual(
    loadStrategyWindows(fakeStorage({ strategyWindows: "{oops" }), VIEWPORT),
    []
  );
  assert.deepEqual(loadStrategyWindows(fakeStorage(), VIEWPORT), []);

  const storage = fakeStorage({
    strategyWindows: JSON.stringify([
      { setupId: "abc", x: 4000, y: 3000, width: 400, height: 400 },
      { setupId: "abc", x: 10, y: 10, width: 400, height: 400 },
      { setupId: "", x: 10, y: 10 },
      null,
    ]),
  });
  const restored = loadStrategyWindows(storage, VIEWPORT);
  // One window per setup, the second copy of "abc" dropped.
  assert.equal(restored.length, 1);
  assert.equal(restored[0].setupId, "abc");
  // Pulled back onto the screen rather than restored off it.
  assert.ok(restored[0].x <= VIEWPORT.width - restored[0].width - 4);
  assert.ok(restored[0].y <= VIEWPORT.height - restored[0].height - 4);
});

test("a stored window is pulled into a smaller screen", () => {
  const storage = fakeStorage({
    strategyWindows: JSON.stringify([
      { setupId: "abc", x: 900, y: 700, width: 700, height: 800 },
    ]),
  });
  const [win] = loadStrategyWindows(storage, { width: 800, height: 600 });
  assert.equal(win.width, 700);
  assert.equal(win.height, 592);
  assert.equal(win.x, 800 - 700 - 4);
  assert.equal(win.y, 4);
});

test("the title bar falls back to the feature label", () => {
  assert.equal(windowTitle({ title: "Random Roles" }), "Random Roles");
  assert.equal(windowTitle({ title: "   " }), "Strategies");
  assert.equal(windowTitle({}), "Strategies");
  assert.equal(windowTitle(null), "Strategies");
});
