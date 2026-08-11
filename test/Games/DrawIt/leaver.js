const dotenv = require("dotenv").config();
const { expect } = require("chai");
const DrawItGame = require("../../../Games/types/DrawIt/Game");

function makeBareGame() {
  return new DrawItGame({
    id: "test",
    hostId: "host",
    isTest: true,
    settings: {
      roundAmt: 1,
      wordDeckId: null,
      stateLengths: { Draw: 60_000 },
      pregameCountdownLength: 0,
      setup: { total: 3 },
    },
  });
}

function makePlayerStub(name) {
  let score = 0;
  return {
    name,
    addScore: (n) => {
      score += n;
    },
    getScore: () => score,
    queueAlert: () => {},
    // beginRevealState broadcasts to every player
    send: () => {},
    user: { achievements: [] },
    EarnedAchievements: [],
  };
}

function setupRevealGame(overrides = {}) {
  const game = makeBareGame();
  const players = [
    makePlayerStub("A"),
    makePlayerStub("B"),
    makePlayerStub("C"),
  ];
  game.players = players;
  game.turnOrder = [...players];
  game.spectators = [];
  game.queueAlert = () => {};
  game.achievementsAllowed = () => false;
  game._stateName = "Reveal";
  game.getStateName = function () {
    return this._stateName;
  };
  game.currentWord = "apple";
  game.currentStrokes = [];
  game.currentGuessers = [];
  game.currentDrawerIndex = 0;
  game.currentRound = 0;
  game.drawingHistory = [];
  Object.assign(game, overrides);
  return { game, players };
}

describe("DrawIt leaver and turn rotation", () => {
  it("does not rotate drawer during Reveal (rotation happens at Pick)", () => {
    const { game } = setupRevealGame({ currentDrawerIndex: 0 });
    game.beginRevealState();
    expect(game.currentDrawerIndex).to.equal(0);
    expect(game.currentRound).to.equal(0);
    expect(game.drawingHistory.length).to.equal(1);
  });

  it("records a drawingHistory entry on Reveal for end detection", () => {
    const { game, players } = setupRevealGame({ currentDrawerIndex: 2 });
    game.beginRevealState();
    expect(game.drawingHistory).to.have.length(1);
    expect(game.drawingHistory[0].drawer).to.equal(players[2].name);
    expect(game.drawingHistory[0].word).to.equal("apple");
    // Index still not advanced here
    expect(game.currentDrawerIndex).to.equal(2);
  });

  it("drawer earns 0 when no guessers", () => {
    const { game, players } = setupRevealGame();
    game.beginRevealState();
    expect(players[0].getScore()).to.equal(0);
  });

  it("drawer earns full score when all guess at rank 0", () => {
    const { game, players } = setupRevealGame();
    game.currentGuessers = [players[1]]; // one guesser at rank 0 → drawer earns 10
    game.beginRevealState();
    expect(players[0].getScore()).to.equal(10);
  });

  it("checkWinConditions returns false when rounds incomplete", () => {
    const { game, players } = setupRevealGame();
    game.players = players;
    game.turnOrder = players;
    game.drawingHistory = [];
    game.currentRound = 0;
    const [done] = game.checkWinConditions();
    expect(done).to.equal(false);
  });

  it("checkWinConditions returns true and finds the winner when rounds complete", () => {
    const { game, players } = setupRevealGame();
    players[1].addScore(50);
    players[0].addScore(20);
    players[2].addScore(10);
    game.players = players;
    game.turnOrder = players;
    // roundAmt 1 × 3 drawers → 3 completed turns required
    game.drawingHistory = [
      { drawer: "A", word: "x", strokes: [] },
      { drawer: "B", word: "y", strokes: [] },
      { drawer: "C", word: "z", strokes: [] },
    ];

    const [done, winners] = game.checkWinConditions();

    expect(done).to.equal(true);
    expect(winners).to.exist;
  });
});
