const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const EventEmitter = require("events");
const sockets = require("../lib/sockets");
const {
  findSpectatorChatMeeting,
  mergeSpectatorChat,
  pickSpeechTarget,
  pregameSpectatorList,
} = require("../react_main/src/shared/spectatorChat");
const {
  tabCompleteNames,
  completePlayerName,
} = require("../react_main/src/shared/tabComplete");

function meeting(id, name, extra) {
  return Object.assign(
    {
      id,
      name,
      speech: true,
      amMember: true,
      canTalk: true,
      members: [{ id: "a" }, { id: "b" }],
      messages: [],
    },
    extra || {}
  );
}

describe("Spectator chat (client helpers)", function () {
  const village = meeting("v", "Village", {
    messages: [
      { id: "1", senderId: "p1", content: "day talk", time: 10 },
      { id: "3", senderId: "p2", content: "more", time: 30 },
    ],
  });
  const spec = meeting("s", "Spectator Meeting", {
    messages: [{ id: "2", senderId: "x", content: "spec talk", time: 20 }],
  });

  it("finds the spectator meeting for spectators only", function () {
    const meetings = { v: village, s: spec };
    findSpectatorChatMeeting(meetings, true).should.equal(spec);
    expect(findSpectatorChatMeeting(meetings, false)).to.equal(null);
    expect(findSpectatorChatMeeting({ v: village }, true)).to.equal(null);
  });

  it("merges spectator messages inline in time order and marks them", function () {
    const merged = mergeSpectatorChat(village.messages, spec, "v");
    merged.map((m) => m.content).should.deep.equal([
      "day talk",
      "spec talk",
      "more",
    ]);
    merged[1].spectatorChat.should.equal(true);
    expect(merged[0].spectatorChat).to.equal(undefined);
    // The stored message is not changed.
    expect(spec.messages[0].spectatorChat).to.equal(undefined);
  });

  it("does not duplicate when the spectator meeting is the selection", function () {
    const merged = mergeSpectatorChat(spec.messages, spec, "s");
    merged.should.have.lengthOf(1);
    merged[0].spectatorChat.should.equal(true);
    mergeSpectatorChat(village.messages, null, "v").should.equal(
      village.messages
    );
  });

  it("a spectator who cannot talk in the selected meeting says it to spectators", function () {
    const watchedVillage = meeting("v", "Village", { amMember: false });
    pickSpeechTarget({
      activeMeeting: watchedVillage,
      spectatorMeeting: spec,
      isPregame: false,
    }).should.deep.equal({ meetingId: "s", spectatorChat: true });

    pickSpeechTarget({
      activeMeeting: null,
      spectatorMeeting: spec,
      isPregame: false,
    }).should.deep.equal({ meetingId: "s", spectatorChat: true });
  });

  it("players keep talking in their own meeting", function () {
    pickSpeechTarget({
      activeMeeting: village,
      spectatorMeeting: null,
      isPregame: false,
    }).should.deep.equal({ meetingId: "v", spectatorChat: false });

    const pregame = meeting("p", "Pregame", { members: [{ id: "a" }] });
    pickSpeechTarget({
      activeMeeting: pregame,
      spectatorMeeting: null,
      isPregame: true,
    }).should.deep.equal({ meetingId: "p", spectatorChat: false });

    const muted = meeting("v", "Village", { canTalk: false });
    pickSpeechTarget({
      activeMeeting: muted,
      spectatorMeeting: null,
      isPregame: false,
    }).should.deep.equal({ meetingId: null, spectatorChat: false });
  });

  it("lists spectators only in pregame", function () {
    const spectators = {
      s1: { id: "s1", name: "zed", watching: true },
      s2: { id: "s2", name: "amy", watching: true },
      s3: { id: "s3", name: "gone" },
    };
    pregameSpectatorList(spectators, { currentState: -1, stateViewing: -1 })
      .map((s) => s.name)
      .should.deep.equal(["amy", "zed"]);
    pregameSpectatorList(spectators, {
      currentState: 1,
      stateViewing: 1,
    }).should.deep.equal([]);
    pregameSpectatorList(spectators, {
      currentState: 1,
      stateViewing: -1,
    }).should.deep.equal([]);
    pregameSpectatorList(spectators, {
      currentState: -1,
      stateViewing: -1,
      review: true,
    }).should.deep.equal([]);
    pregameSpectatorList(undefined, {
      currentState: -1,
      stateViewing: -1,
    }).should.deep.equal([]);
  });
});

describe("Tab completion names", function () {
  const players = {
    p1: { id: "p1", name: "Alice" },
    p2: { id: "p2", name: "Bob" },
  };
  const spectators = {
    s1: { id: "s1", name: "Watcher", watching: true },
    s2: { id: "s2", name: "OldSpec" },
  };

  it("players complete current spectators in pregame", function () {
    tabCompleteNames({ players, spectators, isPregame: true, isSpectator: false })
      .should.deep.equal(["Alice", "Bob", "Watcher"]);
  });

  it("spectators complete players and spectators", function () {
    tabCompleteNames({ players, spectators, isPregame: true, isSpectator: true })
      .should.deep.equal(["Alice", "Bob", "Watcher"]);
    tabCompleteNames({ players, spectators, isPregame: false, isSpectator: true })
      .should.deep.equal(["Alice", "Bob", "Watcher"]);
  });

  it("players in a started game get player names only", function () {
    tabCompleteNames({ players, spectators, isPregame: false, isSpectator: false })
      .should.deep.equal(["Alice", "Bob"]);
  });

  it("handles missing maps and repeated names", function () {
    tabCompleteNames({ players: undefined, spectators: undefined, isPregame: true })
      .should.deep.equal([]);
    tabCompleteNames({
      players,
      spectators: { s3: { id: "s3", name: "Alice", watching: true } },
      isPregame: true,
    }).should.deep.equal(["Alice", "Bob"]);
  });
});

describe("Tab completion with repeated names", function () {
  // What the client map holds after B spectates and takes a seat again (or
  // leaves and rejoins in pregame): the old entry stays, marked left.
  const players = {
    a: { id: "a", name: "Alice" },
    b1: { id: "b1", name: "Bob", left: true },
    c: { id: "c", name: "Carol" },
    b2: { id: "b2", name: "Bob" },
  };

  it("skips left players and keeps the rejoined one once", function () {
    tabCompleteNames({ players, spectators: {}, isPregame: true })
      .should.deep.equal(["Alice", "Carol", "Bob"]);
  });

  it("a left player is not a candidate at all", function () {
    tabCompleteNames({
      players: { x: { id: "x", name: "Gone", left: true } },
      spectators: { s: { id: "s", name: "Gone2", watching: true, left: true } },
      isPregame: true,
    }).should.deep.equal([]);
  });

  it("drops empty and missing names", function () {
    tabCompleteNames({
      players: { a: { id: "a", name: "" }, b: { id: "b" }, c: null, d: { name: "Dee" } },
      spectators: { s: { id: "s", name: "", watching: true } },
      isPregame: true,
    }).should.deep.equal(["Dee"]);
  });

  it("a player and a spectator with the same name complete once", function () {
    const names = tabCompleteNames({
      players: { a: { id: "a", name: "Bob" } },
      spectators: {
        s: { id: "s", name: "Bob", watching: true },
        t: { id: "t", name: "Bobby", watching: true },
      },
      isPregame: true,
    });
    names.should.deep.equal(["Bob", "Bobby"]);
    completePlayerName("bo", names).should.equal("Bob");
    completePlayerName("bobb", names).should.equal("Bobby");
  });

  it("completes a left-and-rejoined name instead of hanging", function () {
    // Even with the raw map (left entry included) the loop must end.
    const raw = Object.values(players).map((p) => p.name);
    completePlayerName("b", raw).should.equal("Bob");
    completePlayerName("Bob", ["Bob", "Bob", "Bob"]).should.equal("Bob");
    const names = tabCompleteNames({ players, spectators: {}, isPregame: true });
    completePlayerName("b", names).should.equal("Bob");
  });

  it("completes a current spectator's name in pregame only for players", function () {
    const spectators = { s: { id: "s", name: "Watcher", watching: true } };
    completePlayerName(
      "wa",
      tabCompleteNames({ players, spectators, isPregame: true, isSpectator: false })
    ).should.equal("Watcher");
    expect(
      completePlayerName(
        "wa",
        tabCompleteNames({ players, spectators, isPregame: false, isSpectator: false })
      )
    ).to.equal(null);
  });
});

describe("Socket hand-over", function () {
  it("does not replay old messages to the next owner", function () {
    const ws = new EventEmitter();
    ws.readyState = 1;
    ws.send = () => {};
    const socket = new sockets.ServerSocket(ws);

    const first = [];
    socket.on("speak", (data) => first.push(data));
    ws.emit("message", sockets.stringifyMessage("speak", { content: "/join" }));
    first.should.have.lengthOf(1);

    // A listener attached late during connect still gets the replay.
    const late = [];
    socket.on("speak", (data) => late.push(data));
    late.should.have.lengthOf(1);

    socket.clearListeners();
    const next = [];
    socket.on("speak", (data) => next.push(data));
    next.should.have.lengthOf(0);

    ws.emit("message", sockets.stringifyMessage("speak", { content: "hi" }));
    next.should.have.lengthOf(1);
    next[0].content.should.equal("hi");
  });
});
