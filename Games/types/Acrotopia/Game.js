const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Random = require("../../../lib/Random");
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

    this.currentRound = 0;
    this.currentAcronym = "";

    // map from acronym to player
    this.currentExpandedAcronyms = new ArrayHash();

    this.acronymHistory = [];
    this.currentAcronymHistory = [];
  }

  incrementState() {
    super.incrementState();

    if (this.alivePlayers().length <= 2) {
      this.endAndTabulateScores();
      return;
    }

    if (this.getStateName() == "Night") {
      if (this.currentRound >= this.roundAmt) {
        this.endAndTabulateScores();
        return;
      }
      this.saveAcronymHistory("name");
      this.emptyAcronymHistory();
      this.generateNewAcronym();
      return;
    }

    if (this.getStateName() == "Day") {
      this.saveAcronymHistory("anon");
      let action = new Action({
        actor: {
          role: undefined,
        },
        game: this,
        run: function () {
          this.game.tabulateScores();
        },
      });

      this.currentRound += 1;
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
    this.currentAcronym = acronym;
    this.queueAlert(`The acronym is ${acronym}.`);
  }

  recordExpandedAcronym(player, expandedAcronym) {
    this.currentExpandedAcronyms[expandedAcronym] = {
      player: player,
      voters: [],
      score: 0,
      name: expandedAcronym,
    };
  }

  recordVote(player, expandedAcronym) {
    this.currentExpandedAcronyms[expandedAcronym].voters.push(player);
    this.currentExpandedAcronyms[expandedAcronym].score += 1;
  }

  tabulateScores() {
    let winningScore = 1;
    let winningAcronyms = [];

    for (let expandedAcronym in this.currentExpandedAcronyms) {
      let acronymObj = this.currentExpandedAcronyms[expandedAcronym];
      if (acronymObj.score == winningScore) {
        winningAcronyms.push(expandedAcronym);
        continue;
      }

      if (acronymObj.score > winningScore) {
        winningScore = acronymObj.score;
        winningAcronyms = [];
        winningAcronyms.push(expandedAcronym);
        continue;
      }
    }

    this.queueAlert(`The winning acronym(s) for ${this.currentAcronym} are...`);

    let hasMultipleWinners = winningAcronyms.length > 1;
    let scoreToGive = hasMultipleWinners
      ? Math.round(10 / winningAcronyms.length)
      : 10;
    for (let expandedAcronym of winningAcronyms) {
      let acronymObj = this.currentExpandedAcronyms[expandedAcronym];
      acronymObj.player.addScore(scoreToGive);
      acronymObj.isWinner = true;
      this.queueAlert(`${acronymObj.player.name}: ${expandedAcronym}`);
    }
  }

  endAndTabulateScores() {
    let highestScore = 0;
    let highestPeople = [];
    for (let player of this.players) {
      if (!player.alertSent) {
        this.queueAlert(`${player.name} has ${player.score} points.`);
        player.alertSent = true;
      }

      if (player.score == highestScore) {
        highestPeople.push(player);
      }
      if (player.score > highestScore) {
        highestPeople = [player];
        highestScore = player.score;
      }
    }

    this.endNow = true;
    var winners = new Winners(this);
    for (let p of highestPeople) {
      winners.addPlayer(p, p.name);
    }
    this.endGame(winners);
  }

  saveAcronymHistory(type) {
    let currentAcronymHistory = [];

    for (let expandedAcronym in this.currentExpandedAcronyms) {
      let acronymObj = this.currentExpandedAcronyms[expandedAcronym];
      let acronymObjToSave = {
        name: acronymObj.name,
        player: acronymObj.player.name,
        voters: acronymObj.voters.map((v) => v.name),
        score: acronymObj.score,
        isWinner: acronymObj.isWinner || false,
      };
      switch (type) {
        case "anon":
          acronymObjToSave.display = "-";
          break;
        case "name":
          acronymObjToSave.display = acronymObjToSave.player;
          break;
      }
      currentAcronymHistory.push(acronymObjToSave);
    }
    this.acronymHistory = Random.randomizeArray(currentAcronymHistory);
  }

  emptyAcronymHistory() {
    this.currentExpandedAcronyms = new ArrayHash();
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);

    let scores = {};
    for (let p of this.players) {
      scores[p.name] = p.getScore();
    }
    info.extraInfo = {
      acronymHistory: this.acronymHistory,
      scores: scores,
      currentAcronym: this.currentAcronym,
    };
    return info;
  }

  // process player leaving immediately
  async playerLeave(player) {
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

    await super.playerLeave(player);
  }

  getGameTypeOptions() {
    return {
      roundAmt: this.roundAmt,
      acronymSize: this.acronymSize,
    };
  }
};
