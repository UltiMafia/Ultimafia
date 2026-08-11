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
    send: () => {},
  };
}

function prepReveal(game, players, opts = {}) {
  game.players = players;
  game.turnOrder = [...players];
  game.queueAlert = () => {};
  game.broadcast = () => {};
  game.broadcastCanvasState = () => {};
  game.achievementsAllowed = () => false;
  game._stateName = "Reveal";
  game.getStateName = function () {
    return this._stateName;
  };
  game.currentWord = opts.word || "apple";
  game.currentStrokes = [];
  game.currentGuessers = opts.guessers || [];
  game.currentDrawerIndex = opts.drawerIndex != null ? opts.drawerIndex : 0;
  game.currentRound = opts.round != null ? opts.round : 0;
  if (!game.drawingHistory) game.drawingHistory = [];
}

describe("DrawIt leaver and turn rotation", () => {
  // beginRevealState no longer rotates the drawer — rotation happens at Pick start
  // so Reveal UI still shows the player who drew this round.
  it("does not advance drawer index during Reveal", () => {
    const game = makeBareGame();
    const players = [
      makePlayerStub("A"),
      makePlayerStub("B"),
      makePlayerStub("C"),
    ];
    prepReveal(game, players, { drawerIndex: 0 });

    game.beginRevealState();

    expect(game.currentDrawerIndex).to.equal(0);
    expect(game.currentRound).to.equal(0);
    expect(game.drawingHistory).to.have.length(1);
  });

  it("records drawing history on Reveal without wrapping the round", () => {
    const game = makeBareGame();
    const players = [
      makePlayerStub("A"),
      makePlayerStub("B"),
      makePlayerStub("C"),
    ];
    prepReveal(game, players, { drawerIndex: 2, round: 0 });

    game.beginRevealState();

    expect(game.currentDrawerIndex).to.equal(2);
    expect(game.currentRound).to.equal(0);
    expect(game.drawingHistory[0].drawer).to.equal("C");
    expect(game.drawingHistory[0].word).to.equal("apple");
  });

  it("drawer earns 0 when no guessers", () => {
    const game = makeBareGame();
    const players = [
      makePlayerStub("A"),
      makePlayerStub("B"),
      makePlayerStub("C"),
    ];
    prepReveal(game, players, { drawerIndex: 0, guessers: [] });

    game.beginRevealState();

    expect(players[0].getScore()).to.equal(0);
  });

  it("drawer earns full score when one guesser at rank 0", () => {
    const game = makeBareGame();
    const players = [
      makePlayerStub("A"),
      makePlayerStub("B"),
      makePlayerStub("C"),
    ];
    // only one guesser at rank 0 → drawer earns 10
    prepReveal(game, players, {
      drawerIndex: 0,
      guessers: [players[1]],
    });

    game.beginRevealState();

    expect(players[0].getScore()).to.equal(10);
  });

  it("checkWinConditions returns false when rounds incomplete", () => {
    const game = makeBareGame();
    const players = [
      makePlayerStub("A"),
      makePlayerStub("B"),
      makePlayerStub("C"),
    ];
    game.players = players;
    game.turnOrder = [...players];
    game.drawingHistory = [];
    game.currentRound = 0;
    const [done] = game.checkWinConditions();
    expect(done).to.equal(false);
  });

  it("checkWinConditions returns true and finds the winner when rounds complete", () => {
    const game = makeBareGame();
    const players = [
      makePlayerStub("A"),
      makePlayerStub("B"),
      makePlayerStub("C"),
    ];
    players[1].addScore(50);
    players[0].addScore(20);
    players[2].addScore(10);
    game.players = players;
    game.turnOrder = [...players];
    // roundAmt=1, 3 drawers → need 3 completed turns in drawingHistory
    game.drawingHistory = [{}, {}, {}];

    const [done, winners] = game.checkWinConditions();

    expect(done).to.equal(true);
    expect(winners).to.exist;
  });
});
