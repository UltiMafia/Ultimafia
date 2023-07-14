const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");

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
        skipChecks: [() => this.selectedWord],
      },
      {
        name: "Guess Word",
        length: options.settings.stateLengths["Guess Word"],
      },
    ];

    // game settings
    this.wordLength = options.settings.wordLength;
    this.duplicateLetters = options.settings.duplicateLetters;
    this.enableRoundLimit = options.settings.enableRoundLimit;
    this.roundLimit = options.settings.roundLimit;

    // state check
    this.selectedWord = false;

    this.guessHistory = [];
  }

  start() {
    super.start();
  }

  incrementState() {
    if (this.getStateName() == "Select Word") {
      // assign players opponents, ignore people who have vegged
      let alivePlayers = this.alivePlayers();
      for (let i = 1; i < alivePlayers.length; i++) {
        let p = alivePlayers[i];
        let opponent = alivePlayers[i - 1];
        p.assignOpponent(opponent);
      }
      let firstPlayer = alivePlayers[0];
      firstPlayer.assignOpponent(alivePlayers[alivePlayers.length - 1]);
      firstPlayer.turn = true;

      this.selectedWord = true;
    }

    super.incrementState();
  }

  recordGuess(player, guess, score) {
    this.guessHistory.push({
      name: player.name,
      word: guess,
      score: score,
    });

    player.passTurnToOpponent();
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      wordLength: this.wordLength,
      guessHistory: this.guessHistory,
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
          if (this.actor.turn) {
            this.actor.passTurnToOpponent();
          }
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
    for (let p of this.players) {
      this.queueAlert(`${p.name}'s word was: ${p.getOwnWord()}`);
    }

    await super.endGame(winners);
  }

  getGameTypeOptions() {
    return {
      wordLength: this.wordLength,
      duplicateLetters: this.duplicateLetters,
      enableRoundLimit: this.enableRoundLimit,
      roundLimit: this.roundLimit,
    };
  }
};
