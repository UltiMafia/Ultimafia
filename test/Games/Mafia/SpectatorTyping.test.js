const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const Meeting = require("../../../Games/core/Meeting");
const Spectator = require("../../../Games/core/Spectator");
const Player = require("../../../Games/core/Player");
const { TestSocket } = require("../../../lib/sockets");

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

  function typingEvents(socket) {
    return socket.clientMessages.filter(
      (message) => message.eventName === "typing"
    );
  }

  function actor(proto, id, spectator) {
    const person = Object.create(proto);
    person.id = id;
    person.socket = new TestSocket();
    person.spectator = spectator;
    person.role = null;
    person.ExtraRoles = null;
    person.effects = [];
    person.items = [];
    return person;
  }

  it("delivers each typing action once on player and spectator sockets", function () {
    const player = actor(Player.prototype, "p1", false);
    const other = actor(Player.prototype, "p2", false);
    const pregameSpec = actor(Spectator.prototype, "s1", true);
    const inGameSpec = actor(Spectator.prototype, "s2", true);

    function broadcastGame(spectators, visible) {
      return {
        spectators,
        isSpectatorMeeting: () => visible,
        spectatorsSeeTyping(info) {
          for (const spectator of this.spectators) spectator.seeTyping(info);
        },
      };
    }

    const pregame = {
      id: "pre",
      name: "Pregame",
      speech: true,
      anonymous: false,
      members: {
        p1: { player, canTalk: true },
        // Pregame spectators are members so they can speak.
        s1: { player: pregameSpec, canTalk: true },
      },
      game: broadcastGame([pregameSpec], true),
    };

    Meeting.prototype.typing.call(pregame, "p1", true);

    typingEvents(player.socket).should.deep.equal([
      { eventName: "typing", data: { playerId: "p1", meetingId: "pre" } },
    ]);
    typingEvents(pregameSpec.socket).should.deep.equal([
      { eventName: "typing", data: { playerId: "p1", meetingId: "pre" } },
    ]);

    player.socket.flushMessages();
    pregameSpec.socket.flushMessages();
    Meeting.prototype.typing.call(pregame, "p1", false);

    typingEvents(player.socket).should.have.lengthOf(1);
    typingEvents(pregameSpec.socket).should.deep.equal([
      { eventName: "typing", data: { playerId: "p1", meetingId: null } },
    ]);

    const village = {
      id: "village",
      name: "Village",
      speech: true,
      anonymous: false,
      members: {
        p1: { player, canTalk: true },
        p2: { player: other, canTalk: true },
      },
      game: broadcastGame([inGameSpec], true),
    };

    player.socket.flushMessages();
    pregameSpec.socket.flushMessages();
    Meeting.prototype.typing.call(village, "p1", true);

    typingEvents(player.socket).should.have.lengthOf(1);
    typingEvents(other.socket).should.deep.equal([
      { eventName: "typing", data: { playerId: "p1", meetingId: "village" } },
    ]);
    typingEvents(inGameSpec.socket).should.deep.equal([
      { eventName: "typing", data: { playerId: "p1", meetingId: "village" } },
    ]);
    typingEvents(pregameSpec.socket).should.have.lengthOf(0);
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
