const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");

const Random = require("../../../lib/Random");
const wordList = require("./data/words");

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
    this.rounds = option.settings.rounds;
    this.currentRound = 1;
    this.currentAcronym = "";

    this.acronymHistory = [];
    this.expandedAcronyms = {};
    this.points = {};
  }

  incrementState() {
    let previousState = this.getStateName();

    super.incrementState();

    if (this.getStateName() == "Day") {
      let highest = 0;
      let winners = [];
      for (var acronym in this.game.expandedAcronyms){
        if (acronym.votes >= highest){
          if (acronym.votes == highest){
            winners.push(acronym.player)
          } else {
            highest = acronym.votes;
            winners = [acronym.player]
          }
        }
      }
      
      if (this.currentAcronymHistory.length > 0) {
        this.acronymHistory.push({
          type: "clue",
          data: this.currentAcronymHistory,
        });
        this.currentAcronymHistory = [];
      }
    }

    if (this.getStateName() == "Night") {
      this.newAcronym();
      this.expandedAcronyms = {};
      this.queueAlert(`The acronym is ${this.acronym}.`);
    }
  }

  newAcronym() {
    const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charLength = char.length;
    let acronym = "";
    for (var i = 0; i < 5; i++) {
      acronym += characters.charAt(Math.floor(Math.random() * charLength));
    }
    this.acronym = acronym;
  }

  recordAcronym(player, acronym) {
    this.currentAcronymHistory.push({
      name: player.name,
      acronym: acronym,
    });
    if (this.expandedAcronyms[acronym]){
      this.expandedAcronyms[acronym].player.push(player.name);
    } else {
      this.expandedAcronyms[acronym] = {
        player: player.name,
        votes: 0,
      };
    }
  }

  recordVote(acronym) {
    this.expandedAcronyms[acronym].votes += 1;
  }

  // send player-specific state
  broadcastState() {
    for (let p of this.players) {
      p.sendStateInfo();
    }
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      responseHistory: this.responseHistory,
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
          this.target("leave", this.actor, true);
        },
      });

      this.instantAction(action);
    }

    await super.playerLeave(player);
  }

  checkWinConditions() {
    var finished = false;
    var counts = {};
    var winQueue = new Queue();
    var winners = new Winners(this);
    var aliveCount = this.alivePlayers().length;

    //for (let player of this.players) {
    //if score is the highest they win

    winners.determinePlayers();
    return [finished, winners];
  }

  async endGame(winners) {
    this.queueAlert("Someone won!");

    await super.endGame(winners);
  }

  getGameTypeOptions() {
    // not exactly used now
    return {
      disableRehost: false,
    };
  }
};
