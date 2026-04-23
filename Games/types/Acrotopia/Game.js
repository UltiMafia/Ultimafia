const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Random = require("../../../lib/Random");
const Winners = require("../../core/Winners");
const ArrayHash = require("../../core/ArrayHash");

// Acronym letter weights use dictionary-weighted first-letter-of-word
// frequency (how often each letter begins a unique English word), not
// text-weighted letter frequency — the game asks players to start each
// word in a phrase with the given letter, so the relevant stat is the
// size of their candidate vocabulary, not letter prevalence in prose.
// S/C/P lead because of plurals and common prefixes. Generation also
// rejects consecutive duplicate letters to avoid flat draws like "SSS".
const LETTER_FREQUENCIES = {
  S: 12, C: 10, P: 8, A: 7,
  M: 5, B: 5, T: 5, D: 5, R: 5,
  F: 4, E: 4, I: 4,
  H: 3, O: 3, L: 3, U: 3, G: 3,
  N: 2, W: 2,
  K: 1, V: 1, J: 1, Q: 1, Y: 1, Z: 1, X: 1,
};
const WEIGHTED_LETTER_POOL = Object.entries(LETTER_FREQUENCIES)
  .map(([letter, weight]) => letter.repeat(weight))
  .join("");

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
    this.enablePunctuation = options.settings.enablePunctuation;
    this.standardiseCapitalisation = options.settings.standardiseCapitalisation;
    this.turnOnCaps = options.settings.turnOnCaps;

    this.currentRound = 0;
    this.currentAcronym = "";

    // map from acronym to player
    this.currentExpandedAcronyms = new ArrayHash();

    this.acronymHistory = [];
    this.currentAcronymHistory = [];

    // hacky implementation
    this.playerHasVoted = {};
  }

  incrementState() {
    super.incrementState();

    this.clearVoted();
    if (this.getStateName() == "Night") {
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
    let acronym = "";
    let lastLetter = "";
    for (var i = 0; i < this.acronymSize; i++) {
      let next;
      do {
        next = WEIGHTED_LETTER_POOL.charAt(
          Math.floor(Math.random() * WEIGHTED_LETTER_POOL.length)
        );
      } while (next === lastLetter);
      acronym += next;
      lastLetter = next;
    }
    this.currentAcronym = acronym;
    this.queueAlert(`The acronym is ${acronym}.`);

    if (this.currentRound == 0) {
      this.queueAlert(
        `Give a ${this.acronymSize}-word phrase starting with these letters. Go wild!`
      );
    }
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

    this.queueAlert(`The winning acronym(s) for ${this.currentAcronym} are…`);

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

  markVoted(player) {
    let previousVote = this.playerHasVoted[player.name];
    this.playerHasVoted[player.name] = true;

    if (!previousVote) {
      this.players.map((p) => p.sendHistory());
    }
  }

  clearVoted() {
    this.playerHasVoted = {};
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);

    let scores = {};
    for (let p of this.players) {
      scores[p.name] = p.getScore();
    }
    info.extraInfo = {
      acronymHistory: this.acronymHistory,
      currentAcronym: this.currentAcronym,
      round: info.name.match(/Night/)
        ? this.currentRound + 1
        : this.currentRound,
      totalRound: this.roundAmt,
      scores: scores,
      playerHasVoted: this.playerHasVoted,
    };
    return info;
  }

  checkWinConditions() {
    var finished =
      this.alivePlayers().length <= 2 || this.currentRound >= this.roundAmt;
    if (!finished) {
      return [false, undefined];
    }

    let highestScore = 1;
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

    var winners = new Winners(this);
    winners.queueShortAlert = true;
    for (let p of highestPeople) {
      winners.addPlayer(p, p.name);
    }

    if (highestPeople.length == 0) {
      winners.addGroup("No one");
    }

    winners.determinePlayers();
    return [finished, winners];
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

  getGameTypeOptions() {
    return {
      roundAmt: this.roundAmt,
      acronymSize: this.acronymSize,
      enablePunctuation: this.enablePunctuation,
      standardiseCapitalisation: this.standardiseCapitalisation,
      turnOnCaps: this.turnOnCaps,
    };
  }
};
