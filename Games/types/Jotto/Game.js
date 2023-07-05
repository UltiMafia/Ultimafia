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
    this.selectedWord = false;

    this.guessHistory = [];
  }

  start() {
    super.start();
  }

  incrementState() {
    if (this.getStateName == "Night") {
      // assign players opponents, ignore people who have vegged
      let alivePlayers = this.alivePlayers();
      for (let i = 1; i < alivePlayers.length; i++) {
        let p = alivePlayers.at(i);
        let opponent = alivePlayers.at(i - 1);
        p.opponent = opponent;
      }
      let firstPlayer = alivePlayers.at(0);
      firstPlayer.opponent = alivePlayers.at(alivePlayers.length - 1);
      firstPlayer.turn = true;

      this.selectedWord = true;
    }

    super.incrementState();
  }

  recordGuess(player, guess, score) {
    this.guessHistory.push({
      name: player.name,
      guess: guess,
      score: score,
    });

    player.turn = false;
    player.opponent.turn = true;
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
    if (this.started) {
      let action = new Action({
        actor: player,
        target: player,
        game: this,
        run: function () {
          if (this.actor.turn) {
            this.actor.opponent.turn = true;
          }
          this.target.kill("leave", this.actor, true);
        },
      });

      this.instantAction(action);
    }

    await super.playerLeave(player);
  }

  getGameTypeOptions() {
    return {
      wordLength: this.wordLength,
    };
  }
};
