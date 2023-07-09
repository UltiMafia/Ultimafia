const Game = require("../../core/Game");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const DrawDiscardPile = require("./DrawDiscardPile");
const Random = require("../../../lib/Random");

module.exports = class SecretHitlerGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Secret Hitler";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Nomination",
        length: options.settings.stateLengths["Nomination"],
        skipChecks: [() => this.specialElection],
      },
      {
        name: "Election",
        length: options.settings.stateLengths["Election"],
      },
      {
        name: "Legislative Session",
        length: options.settings.stateLengths["Legislative Session"],
        skipChecks: [() => this.electedGovernment],
      },
      {
        name: "Executive Action",
        length: options.settings.stateLengths["Executive Action"],
        skipChecks: [() => this.powerGranted],
      },
      {
        name: "Special Nomination",
        length: options.settings.stateLengths["Special Nomination"],
        skipChecks: [() => this.normalElection],
      },
    ];
    this.playerList = [];
    this.currentPlayerIndex = -1;

    this.hitlerChancellor = false;
    this.hitlerAssassinated = false;
    this.countryChaos = false;
    this.electedGovernment = false;
    this.powerGranted = false;
    this.vetoUnlocked = false;
    this.vetoInitiated = false;
    this.specialElection = false;
    this.normalElection = true;

    this.electionTracker = 0;
    this.numLiberalPolicyEnacted = 0;
    this.numFascistPolicyEnacted = 0;
    
    this.drawDiscardPile = new DrawDiscardPile();
  }

  start() {
    this.drawDiscardPile.initCards();

    this.currentPlayerIndex = Random.randInt(0, this.players.length - 1);
    let firstPlayer = this.players.at(this.currentPlayerIndex);
    this.queueAlert(
      `${firstPlayer.name} has been selected as the presidential candidate.`
    );
    firstPlayer.holdItem("Presidential Candidate");
    super.start();
  }

  incrementState() {
    let previousState = this.getStateName();

    if (this.countryChaos == false) {
      if (previousState == "Election" && this.electedGovernment == false) {
        if (this.electionTracker < 3) {
          this.incrementCurrentIndex();
          let nextPlayer = this.currentPlayerList[this.currentIndex];
          while (this.currentIndex > this.currentPlayerList.length)
            if (nextPlayer.alive) {
              this.queueAlert(
                `${nextPlayer.name} has been selected as the presidential candidate.`
              );
              nextPlayer.holdItem("Presidential Candidate");
            } else {
              this.incrementCurrentIndex();
            }
        } else {
          this.countryChaos = true;
          this.queueAlert(`The country has been thrown into chaos.`);
          enactPolicy(0);
          delete this.electedPresident;
          delete this.electedChancellor;
        }
      }
      super.incrementState();
    }
  }

  enactPolicy(policyIndex) {
    this.electionTracker = 0;
    this.queueAlert(`${this.drawPile[policyIndex]} has been enacted`);
    if (this.drawPile[policyIndex] == "Liberal") {
      this.powerGranted = false;
      this.liberalPolicyEnacted = this.liberalPolicyEnacted + 1;
    } else if (this.drawPile[policyIndex] == "Fascist") {
      if (this.countryChaos == false) {
        this.queueAlert(
          `${this.electedPresident} has been granted Presidential Power.`
        );
        this.electedPresident.holdItem("Presidential Power");
        this.powerGranted = true;
      } else {
        this.powerGranted = false;
      }
      this.fascistPolicyEnacted = this.fascistPolicyEnacted + 1;
      if (this.fascistPolicyEnacted > 5) {
        this.vetoUnlocked = true;
      }
    }
    this.drawPile.splice(policyIndex, 1);
    refillDrawPile();
    this.policyList = [this.drawPile[0], this.drawPile[1], this.drawPile[2]];
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      electionTracker: this.electionTracker,
      liberalPolicyCount: this.liberalPolicyCount,
      fascistPolicyCount: this.fascistPolicyCount,
    };
    return info;
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
};
