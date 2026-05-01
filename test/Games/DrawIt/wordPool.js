const dotenv = require("dotenv").config();
const { expect } = require("chai");
const DrawItGame = require("../../../Games/types/DrawIt/Game");

function makeBareGame(options = {}) {
  return new DrawItGame({
    id: "test",
    hostId: "host",
    isTest: true,
    settings: {
      roundAmt: options.roundAmt || 1,
      wordDeckId: null,
      stateLengths: { Draw: 60_000 },
      pregameCountdownLength: 0,
      setup: { total: options.total || 3 },
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

function setup(game, totalPlayers, wordPool) {
  const players = [];
  for (let i = 0; i < totalPlayers; i++) players.push(makePlayerStub(`P${i + 1}`));
  game.players = players;
  game.turnOrder = [...players];
  game.wordPool = [...wordPool];
  game.usedWords = [];
  game.queueAlert = () => {};
  return players;
}

describe("DrawIt word pool", () => {
  it("pops 2 words for currentWordOptions when pool has plenty", () => {
    const game = makeBareGame({ roundAmt: 1, total: 3 });
    setup(game, 3, ["apple", "banana", "carrot", "donut", "eggplant"]);
    game.beginPickState();
    expect(game.currentWordOptions).to.have.lengthOf(2);
    expect(game.wordPool).to.have.lengthOf(3);
  });

  it("falls back to 1 word when pool has only one left", () => {
    const game = makeBareGame({ roundAmt: 1, total: 3 });
    setup(game, 3, ["apple"]);
    game.beginPickState();
    expect(game.currentWordOptions).to.have.lengthOf(1);
    expect(game.wordPool).to.have.lengthOf(0);
  });

  it("reshuffles usedWords when pool is empty at Pick", () => {
    const game = makeBareGame({ roundAmt: 1, total: 3 });
    setup(game, 3, []);
    game.usedWords = ["alpha", "beta", "gamma"];
    game.beginPickState();
    // After reshuffle, pool is loaded from usedWords and 2 are popped for options
    expect(game.currentWordOptions.length).to.be.greaterThan(0);
    expect(game.usedWords).to.deep.equal([]); // usedWords cleared per spec
  });

  it("moves picked options into usedWords on beginDrawState", () => {
    const game = makeBareGame({ roundAmt: 1, total: 3 });
    setup(game, 3, ["apple", "banana", "carrot"]);
    game.beginPickState();
    const popped = [...game.currentWordOptions];
    game.beginDrawState();
    expect(game.currentWordOptions).to.deep.equal([]);
    expect(game.usedWords).to.deep.equal(popped);
  });

  it("auto-picks first option if drawer never picked", () => {
    const game = makeBareGame({ roundAmt: 1, total: 3 });
    setup(game, 3, ["apple", "banana", "carrot"]);
    game.beginPickState();
    const firstOption = game.currentWordOptions[0];
    expect(game.currentWord).to.equal(null);
    game.beginDrawState();
    expect(game.currentWord).to.equal(firstOption);
  });
});
