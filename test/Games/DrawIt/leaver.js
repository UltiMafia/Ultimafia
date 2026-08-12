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
    addScore: (n) => { score += n; },
    getScore: () => score,
    queueAlert: () => {},
  };
}

describe("DrawIt leaver and turn rotation", () => {
  it("advances drawer index after Reveal", () => {
    const game = makeBareGame();
    const players = [makePlayerStub("A"), makePlayerStub("B"), makePlayerStub("C")];
    game.players = players;
    game.turnOrder = [...players];
    game.queueAlert = () => {};
    game._stateName = "Reveal";
    game.getStateName = function () { return this._stateName; };
    game.currentWord = "apple";
    game.currentStrokes = [];
    game.currentGuessers = [];
    game.currentDrawerIndex = 0;
    game.currentRound = 0;

    game.beginRevealState();

    expect(game.currentDrawerIndex).to.equal(1);
    expect(game.currentRound).to.equal(0);
  });

  it("wraps drawer index and increments round", () => {
    const game = makeBareGame();
    const players = [makePlayerStub("A"), makePlayerStub("B"), makePlayerStub("C")];
    game.players = players;
    game.turnOrder = [...players];
    game.queueAlert = () => {};
    game._stateName = "Reveal";
    game.getStateName = function () { return this._stateName; };
    game.currentWord = "apple";
    game.currentStrokes = [];
    game.currentGuessers = [];
    game.currentDrawerIndex = 2;
    game.currentRound = 0;

    game.beginRevealState();

    expect(game.currentDrawerIndex).to.equal(0);
    expect(game.currentRound).to.equal(1);
  });

  it("drawer earns 0 when no guessers", () => {
    const game = makeBareGame();
    const players = [makePlayerStub("A"), makePlayerStub("B"), makePlayerStub("C")];
    game.players = players;
    game.turnOrder = [...players];
    game.queueAlert = () => {};
    game._stateName = "Reveal";
    game.getStateName = function () { return this._stateName; };
    game.currentWord = "apple";
    game.currentStrokes = [];
    game.currentGuessers = [];
    game.currentDrawerIndex = 0;
    game.currentRound = 0;

    game.beginRevealState();

    expect(players[0].getScore()).to.equal(0);
  });

  it("drawer earns full score when all guess at rank 0", () => {
    const game = makeBareGame();
    const players = [makePlayerStub("A"), makePlayerStub("B"), makePlayerStub("C")];
    game.players = players;
    game.turnOrder = [...players];
    game.queueAlert = () => {};
    game._stateName = "Reveal";
    game.getStateName = function () { return this._stateName; };
    game.currentWord = "apple";
    game.currentStrokes = [];
    game.currentGuessers = [players[1]]; // only one guesser at rank 0 → drawer earns 10
    game.currentDrawerIndex = 0;
    game.currentRound = 0;

    game.beginRevealState();

    expect(players[0].getScore()).to.equal(10);
  });

  it("checkWinConditions returns false when rounds incomplete", () => {
    const game = makeBareGame();
    game.players = [makePlayerStub("A"), makePlayerStub("B"), makePlayerStub("C")];
    game.currentRound = 0;
    const [done] = game.checkWinConditions();
    expect(done).to.equal(false);
  });

  it("checkWinConditions returns true and finds the winner when rounds complete", () => {
    const game = makeBareGame();
    const players = [makePlayerStub("A"), makePlayerStub("B"), makePlayerStub("C")];
    players[1].addScore(50);
    players[0].addScore(20);
    players[2].addScore(10);
    game.players = players;
    game.currentRound = 1; // roundAmt is 1 → done

    const [done, winners] = game.checkWinConditions();

    expect(done).to.equal(true);
    expect(winners).to.exist;
  });
});
