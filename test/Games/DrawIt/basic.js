require("dotenv").config();
const { expect } = require("chai");
const DrawItGame = require("../../../Games/types/DrawIt/Game");

describe("DrawIt Game class basics", () => {
  function makeBareGame(options = {}) {
    const fakeOptions = {
      id: "test",
      hostId: "host",
      isTest: true,
      settings: {
        roundAmt: options.roundAmt || 3,
        wordDeckId: null, // forces the fallback to the default deck
        stateLengths: { Draw: 60_000 },
        pregameCountdownLength: 0,
        setup: { total: 3 },
      },
    };
    return new DrawItGame(fakeOptions);
  }

  it("has the correct type and states", () => {
    const game = makeBareGame();
    expect(game.type).to.equal("Draw It");
    const stateNames = game.states.map((s) => s.name);
    expect(stateNames).to.include.members(["Pick", "Draw", "Reveal"]);
  });

  it("initializes round/drawer counters", () => {
    const game = makeBareGame();
    expect(game.currentRound).to.equal(0);
    expect(game.currentDrawerIndex).to.equal(0);
    expect(game.wordPool).to.deep.equal([]);
    expect(game.currentGuessers).to.deep.equal([]);
  });

  it("getGameTypeOptions returns settings", () => {
    const game = makeBareGame({ roundAmt: 5 });
    expect(game.getGameTypeOptions()).to.deep.equal({
      roundAmt: 5,
      wordDeckId: null,
    });
  });

  it("handlePotentialGuess returns false outside Draw state", () => {
    const game = makeBareGame();
    // No state set, no players — handlePotentialGuess should not throw
    expect(game.handlePotentialGuess({}, "anything")).to.equal(false);
  });

  it("checkWinConditions returns [false] when rounds incomplete", () => {
    const game = makeBareGame();
    // End detection uses drawingHistory.length vs roundAmt * turnOrder.length.
    // Empty turnOrder would make totalTurns 0 and look "complete".
    game.players = [{ name: "A", getScore: () => 0 }];
    game.turnOrder = game.players;
    game.drawingHistory = [];
    const [done] = game.checkWinConditions();
    expect(done).to.equal(false);
  });
});
