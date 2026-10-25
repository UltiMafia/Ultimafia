const chai = require("chai"),
  should = chai.should();
const { nextStateBell } = require("../react_main/src/shared/stateBell");

// The state bell (Mafia) / ping (other game types) rings only on a real state
// change, not on the server re-sending the current state.
function ringsFor(states, lastId = null) {
  const rings = [];
  for (const state of states) {
    const bell = nextStateBell(lastId, state);
    lastId = bell.lastId;
    rings.push(bell.ring);
  }
  return rings;
}

describe("State bell", function () {
  it("does not ring for the first state a page sees", function () {
    ringsFor([{ id: -1, name: "Pregame" }]).should.deep.equal([false]);
  });

  it("does not ring when Pregame is re-sent (Spectate, Join open seat, failed ready check)", function () {
    ringsFor([
      { id: -1, name: "Pregame" },
      { id: -1, name: "Pregame" },
      { id: -1, name: "Pregame" },
      { id: -1, name: "Pregame" },
    ]).should.deep.equal([false, false, false, false]);
  });

  it("rings once per real state change, including into Postgame", function () {
    ringsFor([
      { id: -1, name: "Pregame" },
      { id: 1, name: "Night" },
      { id: 1, name: "Night" },
      { id: 2, name: "Day" },
      { id: -2, name: "Postgame" },
    ]).should.deep.equal([false, true, false, true, true]);
  });

  it("starts from the state already on screen", function () {
    ringsFor([{ id: 3 }, { id: 4 }], 3).should.deep.equal([false, true]);
    ringsFor([{ id: "3" }], 3).should.deep.equal([false]);
  });

  it("ignores states without an id", function () {
    const bell = nextStateBell(2, { name: "x" });
    bell.ring.should.equal(false);
    bell.lastId.should.equal(2);
    nextStateBell(2, null).ring.should.equal(false);
  });
});
