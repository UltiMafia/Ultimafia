const Game = require("../../core/Game");
const Action = require("./Action");
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
        skipChecks: [() => !this.lastElectedPresident],
      },
      {
        name: "Executive Action",
        length: options.settings.stateLengths["Executive Action"],
        skipChecks: [() => !this.lastElectedPresident || !this.powerGranted],
      },
    ];
    this.currentPlayerIndex = -1;

    this.lastElectedPresident = undefined;
    this.lastElectedChancellor = undefined;
    this.presidentialNominee = undefined;
    this.chancellorNominee = undefined;
    this.specialElection = false;

    this.countryChaos = false;
    this.powerGranted = false;
    this.vetoUnlocked = false;

    this.electionTracker = 0;
    this.numLiberalPolicyEnacted = 0;
    this.numFascistPolicyEnacted = 0;

    this.drawDiscardPile = new DrawDiscardPile();
    this.drawnPolicies = [];

    this.presidentialPowersBoard = {};
  }

  start() {
    this.initPresidentialPowersBoard();
    this.drawDiscardPile.initCards();
    this.currentPlayerIndex = Random.randInt(0, this.players.length - 1);
    super.start();
  }

  initPresidentialPowersBoard() {
    if (this.players.length >= 9) {
      this.presidentialPowersBoard[1] = "InvestigateLoyalty";
    }

    if (this.players.length >= 7) {
      this.presidentialPowersBoard[2] = "InvestigateLoyalty";
      this.presidentialPowersBoard[3] = "CallSpecialElection";
    } else {
      this.presidentialPowersBoard[3] = "PolicyPeek";
    }

    this.presidentialPowersBoard[4] = "Execute";
    this.presidentialPowersBoard[5] = "Execute";
  }

  moveToNextPresidentialNominee() {
    this.presidentialNominee = this.players.at(this.currentPlayerIndex);
    while (!this.presidentialNominee.alive) {
      this.incrementCurrentPlayerIndex();
      this.presidentialNominee = this.players.at(this.currentPlayerIndex);
    }
    this.incrementCurrentPlayerIndex();
    this.presidentialNominee.holdItem("PresidentialCandidate");
  }

  incrementCurrentPlayerIndex() {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  incrementFailedElectionTracker() {
    this.electionTracker += 1;
    if (this.electionTracker >= 3) {
      this.throwIntoChaos();
    }
  }

  throwIntoChaos() {
    this.countryChaos = true;
    this.queueAlert(`The country has been thrown into chaos.`);

    let policy = this.drawDiscardPile.draw();
    this.enactPolicy(policy);

    delete this.lastElectedPresident;
    delete this.lastElectedChancellor;
  }

  approveElection() {
    this.lastElectedPresident = this.presidentialNominee;
    delete this.presidentialNominee;
    this.lastElectedChancellor = this.chancellorNominee;
    delete this.chancellorNominee;
    this.queueAlert("The election has succeeded!");
    this.countryChaos = false;

    // draw 3 cards
    this.policyPile = this.drawDiscardPile.drawMultiple(3);
    this.lastElectedPresident.holdItem("PresidentialLegislativePower");
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
    this.removeFromPolicyPile(policy);
    this.drawDiscardPile.discard(this.policyPile[0]);
    this.policyPile = [];
  }

  removeFromPolicyPile(p) {
    let toRemove = this.policyPile.indexOf(p);
    this.policyPile.splice(toRemove, 1);
  }

  enactPolicy(policy) {
    this.powerGranted = false;
    this.electionTracker = 0;

    this.queueAlert(`A ${policy} policy has been enacted!`);

    if (policy == "Liberal") {
      this.numLiberalPolicyEnacted += 1;
    } else {
      this.numFascistPolicyEnacted += 1;
      if (this.numFascistPolicyEnacted == 5) {
        this.vetoUnlocked = true;
        this.queueAlert(
          "Veto power has been unlocked! The leaders now have the option to discard all policies."
        );
      }

      if (this.countryChaos == false) {
        let power = this.presidentialPowersBoard[this.numFascistPolicyEnacted];
        if (power) {
          this.lastElectedPresident.holdItem(power);
          this.powerGranted = true;
        }
      }
    }
  }

  discardPolicy(p) {
    this.removeFromPolicyPile(p);
    this.drawDiscardPile.discard(p);
  }

  incrementState() {
    super.incrementState();

    if (this.getStateName() == "Nomination" && !this.specialElection) {
      this.moveToNextPresidentialNominee();
    }
  }

  holdSpecialElection(target) {
    this.queueAlert(
      `A Special Election has been called! ${target.name} has been selected as the next Presidential Candidate.`
    );
    this.specialElection = true;
    this.presidentialNominee = target;
    target.holdItem("PresidentialCandidate");
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      deckInfo: {
        // from rulebook
        startDeckLiberal: 6,
        startDeckFascist: 11,
        refreshSize: 3,
        deckSize: this.drawDiscardPile.getDrawPileSize(),
        discardSize: this.drawDiscardPile.getDiscardPileSize(),
      },
      policyInfo: {
        liberalPolicyCount: this.numLiberalPolicyEnacted,
        fascistPolicyCount: this.numFascistPolicyEnacted,
      },
      electionInfo: {
        electionTracker: this.electionTracker,
        vetoUnlocked: this.vetoUnlocked,
      },
      candidateInfo: {
        lastElectedPresident: this.lastElectedPresident?.name,
        lastElectedChancellor: this.lastElectedChancellor?.name,
        presidentialNominee: this.presidentialNominee?.name,
        chancellorNominee: this.chancellorNominee?.name,
      },
      presidentialPowersBoard: this.presidentialPowersBoard,
    };
    return info;
  }

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
    var winQueue = new Queue();
    var winners = new Winners(this);
    var aliveCount = this.alivePlayers().length;

    for (let player of this.players) {
      winQueue.enqueue(player.role.winCheck);
    }

    for (let winCheck of winQueue) {
      winCheck.check(winners);
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
