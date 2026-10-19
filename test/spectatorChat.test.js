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
