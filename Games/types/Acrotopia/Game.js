const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const ArrayHash = require("../../core/ArrayHash");

module.exports = class AcrotopiaGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Acrotopia";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Night",
        length: options.settings.stateLengths["Night"],
      },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"],
      },
    ];

    // game settings
    this.roundAmt = options.settings.roundAmt;
    this.acronymSize = options.settings.acronymSize;

    this.currentRound = -1;
    this.currentAcronym = "";

    // map from acronym to player
    this.currentExpandedAcronyms = new ArrayHash();

    this.acronymHistory = [];
    this.currentAcronymHistory = [];
  }

  incrementState() {
    super.incrementState();

    if (this.getStateName() == "Night") {
      this.currentRound += 1;
      this.generateNewAcronym();
      return;
    }

    if (this.getStateName() == "Day") {
      let action = new Action({
        actor: {
          role: undefined,
        },
        game: this,
        run: function () {
          this.game.tabulateScores();
        },
      });

      this.queueAction(action);
    }
  }

  generateNewAcronym() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let acronym = "";
    for (var i = 0; i < this.acronymSize; i++) {
      acronym += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    this.acronym = acronym;
    this.queueAlert(`The acronym is ${acronym}.`);
  }

  recordExpandedAcronym(player, expandedAcronym) {
    this.currentExpandedAcronyms[expandedAcronym] = {
      player: player,
      voters: [],
      score: 0,
    };
  }

  recordVote(player, expandedAcronym) {
    let acronymObj = this.currentExpandedAcronyms[expandedAcronym];
    acronymObj.voters.push(player);
    acronymObj.score += 1;
  }

  tabulateScores() {
    let winningScore = 1;
    let winningAcronyms = [];

    for (let expandedAcronym of this.currentExpandedAcronyms) {
      let acronymObj = this.currentExpandedAcronyms[expandedAcronym];
      if (acronymObj.score > winningScore) {
        winningScore = acronymObj.score;
        winningAcronyms = [expandedAcronym];
        continue;
      }

      if (acronymObj.score == winningScore) {
        winningAcronyms.push(expandedAcronym);
        continue;
      }
    }

    this.queueAlert(`The winning acronym(s) for ${this.currentAcronym} are...`);

    let hasMultipleWinners = winningAcronyms.length > 1;
    let scoreToGive = hasMultipleWinners ? 1 : 2;
    for (let expandedAcronym of winningAcronyms) {
      let acronymObj = this.currentExpandedAcronyms[expandedAcronym];
      acronymObj.player.addScore(scoreToGive);
      this.queueAlert(`${acronymObj.player.name}...`);
      this.queueAlert(expandedAcronym);
    }

    this.acronymHistory.push({
      winningAcronyms: winningAcronyms,
      acronyms: this.currentExpandedAcronyms,
    });

    this.currentExpandedAcronyms = new ArrayHash();
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      acronymHistory: this.acronymHistory,
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
          this.target.kill("leave", this.actor, true);
        },
      });

      this.instantAction(action);
    }

    await super.playerLeave(player);
  }

  checkWinConditions() {
    var finished = this.currentRound > this.roundAmt;
    var winners = finished && this.getWinners();

    return [finished, winners];
  }

  getWinners() {
    var winQueue = new Queue();
    var winners = new Winners(this);

    for (let player of this.players) winQueue.enqueue(player.role.winCheck);

    for (let winCheck of winQueue) {
      let stop = winCheck.check(winners);
      if (stop) break;
    }

    winners.determinePlayers();
    return winners;
  }

  getGameTypeOptions() {
    return {
      roundAmt: this.roundAmt,
      acronymSize: this.acronymSize,
    };
  }
};
