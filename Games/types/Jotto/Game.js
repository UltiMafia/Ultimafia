const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");

const Random = require("../../../lib/Random");
const wordList = require("./data/wordList");

module.exports = class JottoGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Jotto";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Select Word",
        length: options.settings.stateLengths["Select Word"],
        skipChecks: [() => this.competitiveMode || this.selectedWord],
      },
      {
        name: "Guess Word",
        length: options.settings.stateLengths["Guess Word"],
      },
    ];

    // game settings
    this.wordLength = options.settings.wordLength;
    this.duplicateLetters = options.settings.duplicateLetters;
    this.winOnAnagrams = options.settings.winOnAnagrams;
    this.numAnagramsRequired = options.settings.numAnagramsRequired;

    this.competitiveMode = options.settings.competitiveMode;
    this.sharedWord = "";

    this.turnOrder = [];

    // state check
    this.selectedWord = false;
    this.guessHistoryByNames = {};
  }

  start() {
    if (this.competitiveMode) {
      // choose word
      this.sharedWord = Random.randArrayVal(
        wordList[this.wordLength][this.duplicateLetters].raw
      );
      this.players.map((p) => (p.selectWord(this.sharedWord)));
      this.assignOpponentsAndTurns();
      this.queueAlert(
        "This is Competitive Jotto. All players are competing to guess the same word."
      );
    }

    super.start();
  }

  assignOpponentsAndTurns() {
    // assign players opponents, ignore people who have vegged
    let alivePlayers = Random.randomizeArray(this.alivePlayers());
    for (let i = 1; i < alivePlayers.length; i++) {
      let p = alivePlayers[i];
      let opponent = alivePlayers[i - 1];
      p.assignOpponent(opponent);
    }
    let firstPlayer = alivePlayers[0];
    firstPlayer.assignOpponent(alivePlayers[alivePlayers.length - 1]);
    firstPlayer.turn = true;

    this.selectedWord = true;

    alivePlayers.map((p) => (this.guessHistoryByNames[p.name] = []));
    this.turnOrder = alivePlayers.map((p) => p.name);
    if (this.turnOrder.length > 2) {
      this.sendAlert(`The turn order is [${this.turnOrder.join(" -> ")}]`);
    }
  }

  incrementState() {
    if (this.getStateName() == "Select Word") {
      this.assignOpponentsAndTurns();
    }

    super.incrementState();
  }

  recordGuess(player, guess, score) {
    this.guessHistoryByNames[player.name].push({
      word: guess,
      score: score,
    });

    player.passTurnToNextPlayer();
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      wordLength: this.wordLength,
      guessHistoryByNames: this.guessHistoryByNames,
      turnOrder: this.turnOrder,
    };
    return info;
  }

  // process player leaving immediately
  async playerLeave(player) {
    await super.playerLeave(player);

    if (this.started && !this.finished) {
      let action = new Action({
        actor: player,
        target: player,
        game: this,
        run: function () {
          this.target.kill("leave", this.actor, true);
        },
      });

      this.instantAction(action);
    }
  }

  checkWinConditions() {
    var finished = false;
    var counts = {};
    var winQueue = new Queue();
    var winners = new Winners(this);
    winners.queueShortAlert = true;
    var aliveCount = this.alivePlayers().length;

    for (let player of this.players) {
      let alignment = player.role.alignment;

      if (!counts[alignment]) counts[alignment] = 0;

      if (player.alive) counts[alignment]++;

      winQueue.enqueue(player.role.winCheck);
    }

    for (let winCheck of winQueue) {
      winCheck.check(counts, winners, aliveCount);
    }

    if (winners.groupAmt() > 0) finished = true;
    else if (aliveCount == 0) {
      winners.addGroup("No one");
      finished = true;
    }

    winners.determinePlayers();
    return [finished, winners];
  }

  async endGame(winners) {
    if (this.competitiveMode) {
      this.queueAlert(`The word was: ${this.sharedWord}`);
    } else {
      for (let p of this.players) {
        const word = p.getOwnWord();
        if (word) {
          this.queueAlert(`[${p.name}] ${word}`);
        }
      }
    }

    await super.endGame(winners);
  }

  getGameTypeOptions() {
    return {
      wordLength: this.wordLength,
      duplicateLetters: this.duplicateLetters,
      competitiveMode: this.competitiveMode,
      winOnAnagrams: this.winOnAnagrams,
      numAnagramsRequired: this.numAnagramsRequired,
    };
  }
};
