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
      },
      {
        name: "Election",
        length: options.settings.stateLengths["Election"],
      },
      {
        name: "Legislative Session",
        length: options.settings.stateLengths["Legislative Session"],
        skipChecks: [() => !this.electedGovernment],
      },
      {
        name: "Executive Action",
        length: options.settings.stateLengths["Executive Action"],
        skipChecks: [() => !this.electedGovernment && !this.powerGranted],
      },
    ];
    this.currentPlayerIndex = -1;

    this.lastElectedPresident = undefined;
    this.lastElectedChancellor = undefined;
    this.presidentialNominee = undefined;
    this.chancellorNominee = undefined;

    this.hitlerAssassinated = false;
    this.countryChaos = false;
    this.electedGovernment = false;
    this.powerGranted = false;

    this.vetoUnlocked = false;
    this.vetoInitiated = false;

    this.specialElection = false;

    this.electionTracker = 0;
    this.numLiberalPolicyEnacted = 0;
    this.numFascistPolicyEnacted = 0;

    this.drawDiscardPile = new DrawDiscardPile();
    this.drawnPolicies = [];
  }

  start() {
    this.drawDiscardPile.initCards();
    this.currentPlayerIndex = Random.randInt(0, this.players.length - 1);
    this.moveToNextPresidentialNominee();
    super.start();
  }

  moveToNextPresidentialNominee() {
    this.presidentialNominee = this.players.at(this.currentPlayerIndex);
    while (!this.presidentialNominee.alive) {
      this.incrementCurrentPlayerIndex();
      this.presidentialNominee = this.players.at(this.currentPlayerIndex);
    }
    this.incrementCurrentPlayerIndex();
    if (this.specialElection == false) {
      this.presidentialNominee.holdItem("Presidential Candidate");
    }
  }

  incrementCurrentPlayerIndex() {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  incrementFailedElectionTracker() {
    this.electionTracker += 1;
    if (this.electionTracker >= 3) {
      this.throwIntoChaos();
    } else {
      this.moveToNextPresidentialNominee();
    }
  }

  throwIntoChaos() {
    this.countryChaos = true;
    this.queueAlert(`The country has been thrown into chaos.`);

    let policy = this.drawDiscardPile.draw();
    enactPolicy(policy);

    delete this.electedPresident;
    delete this.electedChancellor;
  }

  approveElection() {
    this.electedPresident = this.presidentialNominee;
    this.electedChancellor = this.chancellorNominee;
    this.queueAlert(
      `The election has succeeded, with ${this.electedPresident.name} as President and ${this.electedChancellor.name} as Chancellor`
    );
    this.electedGovernment = true;

    // draw 3 cards
    this.policyPile = this.drawDiscardPile.drawMultiple(3);
    this.electedPresident.holdItem("Presidential Legislative Power");
  }

  vetoAllPolicies() {
    for (let p of this.policyPile) {
      this.drawDiscardPile.discard(p);
    }
    this.policyPile = [];
    this.incrementFailedElectionTracker();
  }

  enactPolicyAndDiscardRemaining(policy) {
    this.enactPolicy(policy);
    this.policyPile.remove(policy);
    this.drawDiscardPile.discard(this.policyPile[0]);
    this.policyPile = [];
  }

  enactPolicy(policy) {
    this.electionTracker = 0;

    this.queueAlert(`A ${policy} policy has been enacted!`);

    if (policy == "Liberal") {
      this.numLiberalPolicyEnacted += 1;
    } else {
      this.numFascistPolicyEnacted += 1;
      if (this.countryChaos || this.numFascistPolicyEnacted <= 2) {
        // no special powers
        return;
      }

      this.electedPresident.holdItem("PresidentialLegislativePower");
    }
  }

  discardPolicy(p) {
    this.policyPile.remove(p);
    this.drawDiscardPile.discard(p);
  }

  incrementState() {
    super.incrementState();

    if (this.getStateName() == "Nomination") {
    }
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      electionTracker: this.electionTracker,
      liberalPolicyCount: this.numLiberalPolicyEnacted,
      fascistPolicyCount: this.numFascistPolicyEnacted,
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
