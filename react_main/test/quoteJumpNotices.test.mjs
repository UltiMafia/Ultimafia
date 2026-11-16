import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Exercise the production hook bodies without needing the game backend or
// duplicating their navigation logic. Component-level checks belong in the
// separate chat browser integration suite.
const source = readFileSync(new URL("../src/pages/Game/Game.jsx", import.meta.url), "utf8");
const callbackStart = source.indexOf("const onQuoteJump = useCallback((quote) => {");
assert.notEqual(callbackStart, -1);
const callback = source.slice(callbackStart).split("}, [history, isSpectator, singleState, updateHistory, game.updateStateViewing]);")[0]
  .replace("const onQuoteJump = useCallback((quote) => {", "");
const effectStart = source.indexOf("  useEffect(() => {\n    if (!quoteJump) return;");
assert.notEqual(effectStart, -1);
const effect = source.slice(effectStart).split("}, [quoteJump, singleState, stateViewing, selTab, messages, windowed]);")[0]
  .replace("  useEffect(() => {", "");
function run(body, context) {
  return new Function(...Object.keys(context), body)(...Object.values(context));
}
function fixture() {
  const notices = [];
  const changes = [];
  const context = {
    quote: { fromState: 1, fromMeetingId: "town", messageId: "original" },
    history: { states: { 1: { meetings: { town: { id: "town", messages: [{ id: "original" }] } } } } },
    isSpectator: false,
    singleState: false,
    getSpeechMeetings: (meetings) => Object.values(meetings),
    findSpectatorChatMeeting: () => null,
    getDefaultSpeechMeetingId: () => "town",
    quoteJumpRef: { current: null },
    setQuoteJump: (target) => changes.push(["target", target]),
    setQuoteJumpNotice: (text) => { if (text) notices.push(text); },
    setAutoScroll: (enabled) => changes.push(["autoScroll", enabled]),
    updateHistory: (action) => changes.push(["history", action]),
    game: { updateStateViewing: (action) => changes.push(["state", action]) },
  };
  return { context, notices, changes };
}

test("quote navigation never announces success or unavailable targets", () => {
  for (const mode of ["present", "missing-history", "unavailable-view"]) {
    const { context, notices, changes } = fixture();
    if (mode === "missing-history") context.history.states = {};
    if (mode === "unavailable-view") context.getSpeechMeetings = () => [];
    run(callback, context);
    assert.deepEqual(notices, [], mode);
    if (mode === "present") {
      assert.deepEqual(context.quoteJumpRef.current, { state: "1", meeting: "town", message: "original", tab: "town" });
      assert.equal(changes.some(([kind]) => kind === "history"), true);
      assert.equal(changes.some(([kind]) => kind === "state"), true);
    } else {
      assert.deepEqual(changes, []);
    }
  }
  for (const present of [true, false]) {
    const { context, notices, changes } = fixture();
    const actions = [];
    const timers = [];
    const row = {
      dataset: { messageId: "original", messageState: "1", messageMeeting: "town" },
      scrollIntoView: (options) => actions.push(["scroll", options]),
      classList: { remove: (name) => actions.push(["remove", name]), add: (name) => actions.push(["add", name]) },
      offsetWidth: 100,
    };
    Object.assign(context, {
      quoteJump: { message: "original", state: "1", meeting: "town", tab: "town" },
      windowed: false,
      cancelAnimationFrame: () => {},
      stateViewing: 1,
      selTab: "town",
      speechDisplayRef: { current: { querySelectorAll: () => present ? [row] : [] } },
      setTimeout: (fn, delay) => timers.push({ fn, delay }),
    });
    // Repeated jumps preserve highlighting and remain silent.
    for (let i = 0; i < 2; i++) run(effect, context);
    assert.deepEqual(notices, [], present ? "rendered target" : "filtered target");
    assert.equal(context.quoteJumpRef.current, null);
    assert.equal(changes.filter(([kind, value]) => kind === "target" && value === null).length, 2);
    assert.equal(actions.filter(([kind]) => kind === "scroll").length, present ? 2 : 0);
    if (present) {
      assert.deepEqual(actions[0], ["scroll", { block: "center", behavior: "auto" }]);
      assert.deepEqual(actions[2], ["add", "reply-jump-highlight"]);
      assert.equal(timers[0].delay, 1600);
      timers[0].fn();
      assert.deepEqual(actions.at(-1), ["remove", "reply-jump-highlight"]);
    }
  }
});
