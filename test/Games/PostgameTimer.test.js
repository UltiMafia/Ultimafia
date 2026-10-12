const chai = require("chai");
const should = chai.should();
const Game = require("../../Games/core/Game");
const ArrayHash = require("../../Games/core/ArrayHash");

// A Mafia day that ends the game when its last vote lands. The real
// checkAllMeetingsReady and gotoNextState run; everything else is stubbed so
// the test can watch the state transitions and the postgame timer.
function dayAboutToEndGame() {
  const cleared = [];
  const timer = (name) => ({
    name,
    clear() {
      cleared.push(name);
    },
  });
  const village = { name: "Village", Important: true, ready: true };
  const game = Object.create(Game.prototype);
  let ends = 0;
  Object.assign(game, {
    id: "g",
    type: "Mafia",
    currentState: 1,
    finished: false,
    players: new ArrayHash(),
    meetings: [village],
    timers: { main: timer("main") },
    history: { recordAllRoles() {}, recordAllDead() {} },
    getStateName() {
      return this.currentState === -2 ? "Postgame" : "Day";
    },
    getStateInfo() {
      return { name: this.getStateName(), delayActions: false };
    },
    getNextStateIndex: () => [2, 0],
    processActionQueue() {},
    finishMeetings() {
      for (const m of this.meetings) m.finished = true;
    },
    // What endGame does for an unranked game: it reaches the postgame
    // meeting and timer without awaiting anything.
    checkGameEnd() {
      if (!this.finished) {
        ends++;
        this.finished = true;
        this.currentState = -2;
        // Postgame chat is not a voting meeting, so it is always "ready".
        this.postgame = { name: "Postgame", ready: true };
        this.meetings.push(this.postgame);
        this.timers.postgame = timer("postgame");
      }
      return true;
    },
  });
  return { game, cleared, ends: () => ends };
}

describe("Postgame timer", function () {
  it("survives the day vote that ends the game", function () {
    const { game, cleared, ends } = dayAboutToEndGame();
    game.checkAllMeetingsReady();
    ends().should.equal(1);
    should.exist(game.timers.postgame);
    cleared.should.not.include("postgame");
    should.not.exist(game.postgame.finished);
  });

  it("is not cleared by a state change after the game finished", function () {
    const { game, cleared } = dayAboutToEndGame();
    game.gotoNextState();
    game.gotoNextState();
    game.checkAllMeetingsReady();
    should.exist(game.timers.postgame);
    cleared.should.deep.equal(["main"]);
    should.not.exist(game.postgame.finished);
  });
});
