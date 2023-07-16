const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Random = require("../../../lib/Random");
const Winners = require("../../core/Winners");
const ArrayHash = require("../../core/ArrayHash");

const defNouns = require("./data/nouns");
const defAdjectives = require("./data/adjectives");    

module.exports = class TiramisuGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Tiramisu";
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

    if (options.settings.defaultDecks || !options.settings.customDecks){
      let nouns = defNouns;
      let adjectives = defAdjectives;
    } else {
      let nouns = [];
      let adjectives = [];
    }
    
    // custom noun/adjective decks
    if (options.settings.customDecks){
      this.customNouns = options.settings.nounDecks.split(" ");
      this.customAdjectives = options.settings.adjetiveDecks.split(" ");

      for (let nounDeck in this.customNouns){
        nouns.concat(nounDeck.profiles);
      }
      for (let adjectiveDeck in this.customadjectives){
        adjectives.concat(adjectiveDeck.profiles);
      }
    }

    // game settings
    this.roundAmt = options.settings.roundAmt;
    this.handSize = options.settings.handSize;
    this.chefNumber = this.setup.chefNumber;
    this.anonChef = this.setup.anonChef;
    this.randChefOrder = this.setup.randChefOrder;

    if (this.randChefOrder){
      this.chefPlayers = this.players;
    } else {
      this.chefPlayers = Random.randomizeArray(this.players);
    }

    this.currentRound = 0;
    this.currentAdjective = "";

    // map from noun to player
    this.currentExpandedNouns = new ArrayHash();

    this.nounHistory = [];
    this.currentNounHistory = [];
    this.chefs = [];

    // hacky implementation
    this.playerHasVoted = {};
  }

  start() {
    this.nouns = Random.randomizeArray(nouns);
    this.adjectives = Random.randomizeArray(adjectives);

    for (let player in this.players){
      for (var i = 0; i < this.handSize; i++){
        dealCard(player);
      }
    }

    this.dealAdjective();
    super.start();
  }

  incrementState() {
    super.incrementState();

    if (this.getStateName() == "Night") {
      this.saveNounHistory("name");
      this.emptyNounHistory();
      this.dealAdjective();
      for (let player in this.players){
        dealCard(player);
      }
      return;
    }

    if (this.getStateName() == "Day") {
      this.assignChef();
      this.saveNounHistory("anon");
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

    this.playerHasVoted = {};
  }

  dealAdjective() {
    let cardDealt = Random.randArrayVal(this.adjectives);
    this.currentAdjective = cardDealt;
    this.adjectives = this.adjectives.filter(c => c !== cardDealt);
  }

  dealCard(player) {
    let cardDealt = Random.randArrayVal(this.nouns);
    player.addCard(cardDealt);
    this.nouns = this.nouns.filter(c => c !== cardDealt);
  }

  assignChef() {
    let newChefs = [];
    if (this.chefs.length == 0){
      chosenChef = Random.randArrayVal(this.chefPlayers);
      for (i = 0; i < this.chefNumber; i++){
        while (chosenChef in newChefs){
          chosenChef = Random.randArrayVal(this.chefPlayers);
        }
        newChefs.push(chosenChef);
      }
    } else {
      for (let chef in this.chefs){
        currentChef = this.chefs.indexOf(chef);
        newChefs.push(this.chefs[currentChef-1]);
      }
    }
    this.chefs = newChefs;
    for (let chef in this.chefs){
      chef.holdItem("ChefHat");
    }
  }

  recordExpandedNoun(player, noun) {
    this.currentExpandedNouns[noun] = {
      player: player,
      voters: [],
      score: 0,
      noun: noun,
    };
  }

  recordVote(player, noun) {
    this.currentExpandedNouns[noun].voters.push(player);
    this.currentExpandedNouns[noun].score += 1;
  }

  tabulateScores() {
    let winningScore = 1;
    let winningNouns = [];

    for (let expandedNoun in this.currentExpandedNouns) {
      let nounObj = this.currentExpandedNouns[expandedNoun];
      if (nounObj.score == winningScore) {
        winningNouns.push(expandedNoun);
        continue;
      }

      if (expandedNoun.score > winningScore) {
        winningScore = nounObj.score;
        winningNouns = [];
        winningNouns.push(expandedNoun);
        continue;
      }
    }

    this.queueAlert(`The winning noun for ${this.currentADjective} are...`);

    let scoreToGive = this.chefNumber == 1 
      ? 1 
      : (hasMultipleWinners
      ? Math.round(10 / winningAcronyms.length)
      : 10);
    for (let expandedNoun of winningNouns) {
      let nounObj = this.currentExpandedNouns[expandedNoun];
      nounObj.player.addScore(scoreToGive);
      nounObj.isWinner = true;
      this.queueAlert(`${nounObj.player.name}: ${expandedNoun}`);
    }
  }

  saveNounHistory(type) {
    let currentNounHistory = [];

    for (let expandedNoun in this.currentExpandedNouns) {
      let nounObj = this.currentExpandedNouns[expandedNoun];
      let nounObjToSave = {
        noun: nounObj.noun,
        player: nounObj.player.name,
        voters: nounObj.voters.map((v) => v.name),
        score: nounObj.score,
        isWinner: nounObj.isWinner || false,
      };
      switch (type) {
        case "anon":
          nounObjToSave.display = "-";
          break;
        case "name":
          nounObjToSave.display = nounObjToSave.player;
          break;
      }
      currentNounHistory.push(nounObjToSave);
    }
    this.nounHistory = Random.randomizeArray(currentNounHistory);
  }

  emptyNounHistory() {
    this.currentExpandedNouns = new ArrayHash();
  }

  markVoted(player) {
    let previousVote = this.playerHasVoted[player.name];
    this.playerHasVoted[player.name] = true;

    if (!previousVote) {
      this.players.map((p) => p.sendHistory());
    }
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);

    let scores = {};
    for (let p of this.players) {
      scores[p.name] = p.getScore();
    }
    info.extraInfo = {
      nounHistory: this.nounHistory,
      currentAdjective: this.currentAdjective,
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
    };
  }
};
