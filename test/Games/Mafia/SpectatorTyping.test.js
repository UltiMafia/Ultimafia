const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const Meeting = require("../../../Games/core/Meeting");
const Spectator = require("../../../Games/core/Spectator");

function makeMember(hasEffect) {
  return {
    canTalk: true,
    player: {
      hasEffect,
      seeTyping() {},
    },
  };
}

function makeContext(overrides = {}) {
  const spec = {
    seen: [],
    seeTyping(info) {
      this.seen.push(info);
    },
  };
  const game = {
    spectators: [spec],
    isSpectatorMeeting: (m) => m.name === "Village",
    spectatorsSeeTyping(info) {
      for (const s of this.spectators) s.seeTyping(info);
    },
  };
  const ctx = {
    id: "m1",
    name: "Village",
    speech: true,
    anonymous: false,
    members: {
      p1: makeMember(() => false),
      p2: makeMember(() => false),
      silenced: makeMember((e) => e === "Silenced"),
    },
    game,
    ...overrides,
  };

  return { ctx, spec };
}

describe("Spectator typing", function () {
  it("shows typing to spectators in a Village meeting", function () {
    const { ctx, spec } = makeContext();

    Meeting.prototype.typing.call(ctx, "p1", true);

    spec.seen.should.deep.equal([{ playerId: "p1", meetingId: "m1" }]);
  });

  it("clears the indicator when typing stops", function () {
    const { ctx, spec } = makeContext();

    Meeting.prototype.typing.call(ctx, "p1", false);

    spec.seen.should.deep.equal([{ playerId: "p1", meetingId: null }]);
  });

  it("hides typing in a Mafia meeting", function () {
    const { ctx, spec } = makeContext({ name: "Mafia" });

    Meeting.prototype.typing.call(ctx, "p1", true);

    spec.seen.should.deep.equal([]);
  });

  it("hides typing from a silenced player in the Village", function () {
    const { ctx, spec } = makeContext();

    Meeting.prototype.typing.call(ctx, "silenced", true);

    spec.seen.should.deep.equal([]);
  });

  it("ignores an unknown player without throwing", function () {
    const { ctx, spec } = makeContext();

    expect(() =>
      Meeting.prototype.typing.call(ctx, "missing", true)
    ).to.not.throw();
    spec.seen.should.deep.equal([]);
  });

  it("hides typing in an anonymous meeting", function () {
    const { ctx, spec } = makeContext({ anonymous: true });

    Meeting.prototype.typing.call(ctx, "p1", true);

    spec.seen.should.deep.equal([]);
  });

  it("sends a typing event from Spectator.seeTyping", function () {
    const sent = [];

    Spectator.prototype.seeTyping.call(
      {
        send(eventName, data) {
          sent.push([eventName, data]);
        },
      },
      { playerId: "p1", meetingId: "m1" }
    );

    sent.should.deep.equal([["typing", { playerId: "p1", meetingId: "m1" }]]);
  });
});
