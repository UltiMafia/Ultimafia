const chai = require("chai"),
  should = chai.should();
const {
  pregameSeatAction,
} = require("../react_main/src/shared/pregameSeatAction");

// The pregame seat action logic (PregameSeatActions), rendered in the player
// list on desktop and in the game chat footer on mobile. The layout itself is
// covered by react_main/test/run-seat-actions.cjs.
describe("Pregame seat action", function () {
  const pregame = { currentState: -1, states: { [-1]: {} } };
  const started = { currentState: 1, states: { [-1]: {}, 1: {} } };

  it("offers Spectate to a seated player when spectating is allowed", function () {
    pregameSeatAction({
      history: pregame,
      isSpectator: false,
      options: { spectating: true },
    }).should.equal("spectate");
    // Lobby options can arrive as strings.
    pregameSeatAction({
      history: pregame,
      isSpectator: false,
      options: { spectating: "true" },
    }).should.equal("spectate");
  });

  it("offers nothing to a seated player when spectating is off", function () {
    for (const spectating of [false, "false", undefined])
      should.equal(
        pregameSeatAction({
          history: pregame,
          isSpectator: false,
          options: { spectating },
        }),
        null,
      );
    should.equal(pregameSeatAction({ history: pregame }), null);
  });

  it("offers Join open seat to a spectator", function () {
    pregameSeatAction({
      history: pregame,
      isSpectator: true,
      options: { spectating: true },
    }).should.equal("join");
    // A spectator can always try to sit, whatever the spectating option says.
    pregameSeatAction({
      history: pregame,
      isSpectator: true,
      options: {},
    }).should.equal("join");
  });

  it("is hidden once the game has started", function () {
    for (const isSpectator of [true, false])
      should.equal(
        pregameSeatAction({
          history: started,
          isSpectator,
          options: { spectating: true },
        }),
        null,
      );
  });

  it("is hidden in a replay and before history loads", function () {
    for (const isSpectator of [true, false])
      should.equal(
        pregameSeatAction({
          review: true,
          history: pregame,
          isSpectator,
          options: { spectating: true },
        }),
        null,
      );
    should.equal(pregameSeatAction({ isSpectator: true }), null);
    should.equal(pregameSeatAction(), null);
  });
});
