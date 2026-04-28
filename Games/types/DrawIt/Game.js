const Game = require("../../core/Game");
const Player = require("./Player");
const Random = require("../../../lib/Random");

module.exports = class DrawItGame extends Game {
  constructor(options) {
    super(options);
    this.type = "Draw It";
    this.Player = Player;
    this.disableObituaries = true;

    this.states = [
      { name: "Postgame" },
      { name: "Pregame" },
      { name: "Pick", length: 5 * 1000 },
      { name: "Draw", length: options.settings.stateLengths["Draw"] },
      { name: "Reveal", length: 5 * 1000 },
    ];

    this.roundAmt = options.settings.roundAmt;
    this.wordDeckId = options.settings.wordDeckId;

    this.currentRound = 0;
    this.currentDrawerIndex = 0;
    this.turnOrder = [];
    this.wordPool = [];
    this.usedWords = [];
    this.currentWordOptions = [];
    this.currentWord = null;
    this.currentStrokes = [];
    this.currentGuessers = [];
    this.drawingHistory = [];
  }

  async start() {
    this.turnOrder = Random.randomizeArray([...this.players]);
    await super.start();
  }

  getGameTypeOptions() {
    return {
      roundAmt: this.roundAmt,
      wordDeckId: this.wordDeckId,
    };
  }
};
