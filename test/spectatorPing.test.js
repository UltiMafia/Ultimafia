const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { isSpectatorPing } = require("../react_main/src/shared/spectatorPing");
const source = fs.readFileSync(process.env.SPECTATOR_PING_GAME_SOURCE ||
  path.join(__dirname, "../react_main/src/pages/Game/Game.jsx"), "utf8");

// Execute the actual production socket callbacks, not a restated ping handler.
// No game services, database, sockets, browser audio or live site are opened.
function session(players = {}, self) {
  const handlers = {};
  const audio = [];
  const notices = [];
  const histories = [];
  const context = {
    socket: { on: (name, fn) => { handlers[name] = fn; } },
    isSpectatorPing,
    EVERYONE_PING: "@every",
    playersRef: { current: players },
    selfRef: { current: self },
    isSpectatorRef: { current: false },
    joinOptionsRef: { current: { spectate: false } },
    noLeaveRef: { current: false },
    stopReadyBellRepeatRef: { current() {} },
    setIsSpectator() {},
    setLeave() {},
    siteInfo: { hideAllAlerts() {}, showAlert() {} },
    updateHistory: (event) => histories.push(event),
    playAudio: (name) => audio.push(name),
    setPingInfo: (notice) => notices.push(notice),
  };
  const parse = source.slice(source.indexOf("function parsePings("), source.indexOf("export const GameTypeContext"));
  vm.runInNewContext(parse, context);
  for (const event of ["message", "isSpectator", "left"]) {
    const start = source.indexOf('    socket.on("' + event + '",');
    assert.notEqual(start, -1);
    const end = source.indexOf("\n    });", start);
    vm.runInNewContext(source.slice(start, end + "\n    });".length), context);
  }
  return { handlers, audio, notices, histories, context };
}

describe("Spectator cuck ping", function () {
  it("matches only the spectator mention with punctuation and capitalization", function () {
    for (const text of ["@cuck", "@CUCK", "hey @cuck!", "(@cuck)", "@cuck\n@cuck"]) {
      assert.equal(isSpectatorPing(text, true), true, text);
    }
  });
  it("matches @cucks and @cucksection the same way", function () {
    for (const text of ["@cucks", "@CUCKS", "hey @cucks!", "@cucksection", "@CuckSection", "(@cucksection)"]) {
      assert.equal(isSpectatorPing(text, true), true, text);
      assert.equal(isSpectatorPing(text, false), false, text);
    }
  });
  it("rejects substrings, handles and non-text values", function () {
    for (const text of ["cuck", "CUCK", "hey cuck!", "@cuckoo", "scuck", "@cuck-name", "name_@cuck", "é@cuck", "@cuck2", "@@cuck", "cucks", "cucksection", "@cuckss", "@cucks2", "@cucks-name", "@@cucks", "@cucksections", "@cucksection2", "x@cucksection", "", null, undefined, {}]) {
      assert.equal(isSpectatorPing(text, true), false, String(text));
    }
  });
  it("rings a confirmed spectator once for each alias and never a seated player", function () {
    for (const content of ["@cuck", "@cucks", "@cucksection", "@cuck @cucks @cucksection"]) {
      const spectator = session();
      spectator.handlers.isSpectator(true);
      spectator.handlers.message({ content });
      assert.deepEqual(spectator.audio, ["ping"], content);
      const seated = session({ p: { name: "Alice" } }, "p");
      seated.handlers.message({ content });
      assert.deepEqual(seated.audio, [], content);
    }
  });
  it("does not infer membership from a truthy value", function () {
    for (const membership of [false, undefined, null, "true", 1]) {
      assert.equal(isSpectatorPing("@cuck", membership), false);
    }
  });
  it("pings each confirmed spectator, including one absent from the player map", function () {
    const sessions = [session(), session(), session()];
    for (const s of sessions) {
      s.handlers.isSpectator(true);
      s.handlers.message({ content: "@cuck", senderId: "sender" });
      assert.deepEqual(s.audio, ["ping"]);
      assert.equal(s.histories.length, 1);
    }
  });
  it("does not ping a living or dead player just for @cuck", function () {
    for (const dead of [false, true]) {
      const s = session({ p: { name: "Alice", dead } }, "p");
      s.handlers.message({ content: "@cuck" });
      assert.deepEqual(s.audio, []);
    }
  });
  it("requires server confirmation, not a requested spectator URL", function () {
    const s = session();
    s.context.joinOptionsRef.current.spectate = true;
    s.handlers.message({ content: "@cuck" });
    assert.deepEqual(s.audio, []);
  });
  it("updates immediately on taking a seat and rejoining spectators", function () {
    const s = session();
    s.handlers.isSpectator(true);
    s.handlers.message({ content: "@cuck" });
    s.handlers.isSpectator(false);
    s.handlers.message({ content: "@cuck" });
    s.handlers.isSpectator(true);
    s.handlers.message({ content: "@cuck" });
    assert.deepEqual(s.audio, ["ping", "ping"]);
  });
  it("clears spectator eligibility when the server removes the session", function () {
    const s = session();
    s.handlers.isSpectator(true);
    s.handlers.left({});
    s.handlers.message({ content: "@cuck" });
    assert.deepEqual(s.audio, []);
  });
  it("rings once even when a line contains repeated and overlapping pings", function () {
    const s = session({ p: { name: "Alice" } }, "p");
    s.handlers.isSpectator(true);
    s.handlers.message({ content: "@cuck @cuck @Alice @everyone" });
    assert.deepEqual(s.audio, ["ping"]);
  });
  it("preserves existing named and everyone pings for players", function () {
    const s = session({ p: { name: "Alice" }, other: { name: "Bob" } }, "p");
    for (const content of ["@Alice", "@everyone", "@Bob", "hello"]) {
      s.handlers.message({ content, senderId: "other" });
    }
    assert.deepEqual(s.audio, ["ping", "ping"]);
    assert.equal(s.notices.length, 1);
    assert.equal(s.notices[0].msg, "⚠ Bob pinged you!");
  });
  it("does not ring for bare cuck in a confirmed spectator session", function () {
    const s = session();
    s.handlers.isSpectator();
    s.handlers.message({ content: "cuck" });
    assert.deepEqual(s.audio, []);
  });
  it("accepts the server's payload-free spectator event before and during play", function () {
    for (const meeting of ["Pregame", "Spectator Meeting"]) {
      const s = session();
      s.handlers.isSpectator();
      s.handlers.message({ content: "@cuck", meetingName: meeting });
      assert.deepEqual(s.audio, ["ping"]);
      s.handlers.isSpectator(false);
      s.handlers.message({ content: "@cuck", meetingName: meeting });
      assert.deepEqual(s.audio, ["ping"]);
    }
  });
  it("does not ring on historical message delivery or messages never delivered", function () {
    const s = session();
    s.handlers.isSpectator(true);
    // The ping callback is registered only for live message, not history/quote.
    assert.deepEqual(Object.keys(s.handlers).sort(), ["isSpectator", "left", "message"]);
    assert.deepEqual(s.audio, []);
  });
  it("uses the same predicate in actual message highlight code and obeys its setting", function () {
    const start = source.indexOf("  let iWasPinged = false;", source.indexOf("function Message(props)"));
    const end = source.indexOf("  // The quoted line", start);
    const block = source.slice(start, end) + "\nresult = iWasPinged;";
    for (const isSpectator of [true, false]) {
      for (const enabled of [true, false]) {
        const context = {
          props: { settings: { highlightMentions: enabled }, players: {}, self: "s" },
          message: { content: "@cuck" }, isSpectator, isSpectatorPing,
          parsePings: (content) => content.match(/@[\w-]*/gm) || [],
          EVERYONE_PING: "@every",
        };
        vm.runInNewContext(block, context);
        assert.equal(context.result, isSpectator && enabled);
      }
    }
  });
});
