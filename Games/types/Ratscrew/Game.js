const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const DrawDiscardPile = require("./DrawDiscardPile");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");

const Random = require("../../../lib/Random");

module.exports = class RatscrewGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Ratscrew";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Play Cards",
        length: options.settings.stateLengths["Play Cards"],
      },
    ];

    // Face-card challenge tracking. When a face card is played, the next
    // player has `attemptsLeft` cards to play another face card or the
    // pile goes to `challenger`. Reset on slap or successful challenge.
    this.faceChallenge = null; // { challenger, attemptsLeft }

    //settings
    /*
    this.wildOnes = options.settings.wildOnes;
    this.spotOn = options.settings.spotOn;
    */
    this.drawDiscardPile = new DrawDiscardPile();
    this.drawDiscardPile.initCards();
    this.MaxRounds = parseInt(options.settings.MaxRounds) || 0;
    this.CardGameType = "Ratscrew";

    // Optional slap-rule modifiers (default off — base ERS rules only).
    this.sumToTen = !!options.settings.sumToTen;
    this.marriageRule = !!options.settings.marriageRule;

    //VARIABLES
    this.randomizedPlayers = []; //All players after they get randomized. Used for showing players and their dice on left side of screen.
    this.randomizedPlayersCopy = []; //copy of above, but players don't get removed on dying / leaving. Used for deciding next player's
    // turn, since variable above would mess up indexes when players got removed.
    this.currentIndex = 0; //Index of player's current turn.
    this.nextToPlay = null; // Player object — whose turn it currently is.
    this.stackEntryId = 0; // Monotonic id for each card placed in TheStack.

    //information about last turn's bid
    this.lastBidder = null;
    this.allRolledDice = []; //Used for counting dice on lie or spot on calls. player.diceRolled would remove dice if player left, so
    // this got created.

    this.allDice = 0; //all dice counted together, used for variable under this and messages sent regarding high bids
    this.gameMasterAnnoyedByHighBidsThisRoundYet = false; //when bid is a lot higher than all dice together, this turns on, and players
    // will only be able to bid by one amount higher each turn for the rest of the round.

    this.chatName = "Casino";

    this.spectatorMeetFilter = {
      Pregame: true,
      Casino: true,
      "The Flying Dutchman": true,
      Amount: false,
      Face: false,
      separationText: false,
      CallLie: false,
      SpotOn: false,
    };
  }

  sendAlert(message, recipients, extraStyle = {}) {
    if (this.chatName === "The Flying Dutchman") {
      extraStyle = { color: "#718E77" };
    }

    super.sendAlert(message, recipients, extraStyle);
  }

  start() {
    //introduction, rules messages
    this.chatName = Math.random() < 0.03 ? "The Flying Dutchman" : "Casino"; //3% for meeting to be called The Flying Dutchman lol

    if (this.chatName == "The Flying Dutchman") {
      this.sendAlert(`Welcome aboard the Flying Dutchman, mates!`, undefined, {
        color: "#718E77",
      });
      this.sendAlert(
        `How many years of servitude be ye willin' to wager?`,
        undefined,
        { color: "#718E77" }
      );
    }

    if (this.MaxRounds >= 1) {
      this.sendAlert(
        `The player with the most Cards wins after Round ${this.MaxRounds}.`
      );
    }
    this.sendAlert(`Good luck... You'll probably need it.`);

    //start of game - randomizes player order, and gives dice to everyone.
    this.hasHost = this.setup.roles[0]["Host:"];
    if (this.hasHost) {
      let hostPlayer = this.players.array()[0];
      this.randomizedPlayers = Random.randomizeArray(
        this.players.array()
      ).filter((p) => p != hostPlayer);
    } else {
      this.randomizedPlayers = Random.randomizeArray(this.players.array());
    }
    this.randomizedPlayersCopy = this.randomizedPlayers;

    this.randomizedPlayers.forEach((player) => {
      player.Chips = parseInt(this.startingChips);
    });

    // super.start();
    //this.rollDice();
    if (this.CardGameType == "Ratscrew") {
      this.TheStack = [];
      this.RankNumber = 1;
      this.drawDiscardPile.shuffle();
      this.setupRatscrew();
    }
    this.startRoundRobin();

    super.start();
  }

  //Start: Randomizes player order, and gives the microphone to first one.
  setupRatscrew() {
    this.ThePot = parseInt(0);
    this.randomizedPlayers.forEach((player) => {
      player.hasFolded = false;
      player.hasHadTurn = false;
      player.Score = 0;
      player.AmountBidding = parseInt(0);
      player.ScoreType = null;
      player.ShowdownCards = [];
    });
    this.RoundNumber = 0;
    if (this.RoundNumber == 0) {
      this.Dealer = this.randomizedPlayersCopy[0];
    }

    let cardAmount = Math.floor(
      this.drawDiscardPile.getDrawPileSize() / this.randomizedPlayersCopy.length
    );

    this.dealCards(cardAmount);
  }

  startRoundRobin() {
    while (true) {
      let nextPlayer = this.randomizedPlayersCopy[this.currentIndex];
      if (nextPlayer.alive && nextPlayer.hasFolded != true) {
        nextPlayer.howManySelected = false;
        nextPlayer.whichFaceSelected = false;
        nextPlayer.holdItem("Microphone");
        // Initial turn assignment.
        this.nextToPlay = nextPlayer;
        return;
      }
    }
  }

  // Advance the turn to the next alive player who still has cards.
  // Wraps around the round-robin order.
  rotateNextToPlay() {
    if (!this.nextToPlay) {
      this.nextToPlay = this.randomizedPlayersCopy[0];
    }
    const order = this.randomizedPlayersCopy;
    const startIdx = Math.max(order.indexOf(this.nextToPlay), 0);
    for (let i = 1; i <= order.length; i++) {
      const candidate = order[(startIdx + i) % order.length];
      if (candidate && candidate.alive && candidate.CardsInHand.length > 0) {
        this.nextToPlay = candidate;
        return;
      }
    }
    // No eligible player — game is effectively over.
  }

  // Force the next-to-play to a specific player (used when a slap or face-card
  // challenge winner takes the pile).
  setNextToPlay(player) {
    this.nextToPlay = player;
    if (
      !this.nextToPlay.alive ||
      this.nextToPlay.CardsInHand.length === 0
    ) {
      this.rotateNextToPlay();
    }
  }

  //After someone plays, the state restarts and turn advances.
  incrementState() {
    let previousState = this.getStateName();

    if (previousState == "Play Cards") {
      this.RoundNumber++;
      // Turn advancement is handled inline by playCard / applySlap.
    }

    super.incrementState();
  }

  // ---- Card helpers ----

  // Returns the numeric rank of a card object/string, or null if face-down.
  getCardRank(entry) {
    if (!entry) return null;
    if (typeof entry === "object") {
      if (entry.faceDown) return null;
      return this.readCard(entry.value)[0];
    }
    return this.readCard(entry)[0];
  }

  isFaceCard(rank) {
    // Ace, Jack, Queen, King
    return rank === 1 || rank === 11 || rank === 12 || rank === 13;
  }

  faceCardAttempts(rank) {
    if (rank === 11) return 1; // Jack
    if (rank === 12) return 2; // Queen
    if (rank === 13) return 3; // King
    if (rank === 1) return 4; // Ace
    return 0;
  }

  // ---- Slap mechanic ----

  // Returns { valid: bool, reason: string|null } given current stack state.
  validateSlap() {
    const stack = this.TheStack;
    if (stack.length === 0) return { valid: false, reason: "empty stack" };

    const topRank = this.getCardRank(stack[stack.length - 1]);
    if (topRank == null) return { valid: false, reason: "top is face-down" };

    // Doubles: top matches the card immediately under it
    if (stack.length >= 2) {
      const prevRank = this.getCardRank(stack[stack.length - 2]);
      if (prevRank != null && topRank === prevRank) {
        return { valid: true, reason: "doubles" };
      }
    }

    // Sandwich: top matches the card two below it (X-Y-X)
    if (stack.length >= 3) {
      const twoBackRank = this.getCardRank(stack[stack.length - 3]);
      if (twoBackRank != null && topRank === twoBackRank) {
        return { valid: true, reason: "sandwich" };
      }
    }

    // Top-bottom: top matches the bottom-most face-up card
    for (let i = 0; i < stack.length - 1; i++) {
      const bottomRank = this.getCardRank(stack[i]);
      if (bottomRank == null) continue;
      if (bottomRank === topRank) {
        return { valid: true, reason: "top-bottom" };
      }
      break;
    }

    // Optional: top + previous face-up sum to 10 (sumToTen rule).
    if (this.sumToTen && stack.length >= 2) {
      const prevRank = this.getCardRank(stack[stack.length - 2]);
      if (prevRank != null && topRank + prevRank === 10) {
        return { valid: true, reason: "sum to 10" };
      }
    }

    // Optional: K and Q adjacent (marriage rule).
    if (this.marriageRule && stack.length >= 2) {
      const prevRank = this.getCardRank(stack[stack.length - 2]);
      if (
        prevRank != null &&
        ((topRank === 12 && prevRank === 13) ||
          (topRank === 13 && prevRank === 12))
      ) {
        return { valid: true, reason: "marriage" };
      }
    }

    return { valid: false, reason: "no match" };
  }

  applySlap(player) {
    const result = this.validateSlap();

    if (result.valid) {
      this.toast(`${player.name} slaps and takes the pile`);
      this.transferPileTo(player);
      // Slap interrupts any face-card challenge.
      this.faceChallenge = null;
      // Winner of the pile starts the next play.
      this.setNextToPlay(player);
      this.broadcastExtraInfoUpdate();
      // Force the state to cycle so a fresh Play Card meeting opens for the
      // slapper on their new turn. Deferred to escape the action's call stack.
      setImmediate(() => this.gotoNextState());
    } else {
      // Invalid slap — burn one card from the slapper, face-down, into the
      // middle of the stack so it doesn't trigger any combinations.
      // A player with no cards survives a wrong slap; elimination only
      // happens when the pile is awarded to someone else (see transferPileTo).
      if (player.CardsInHand.length === 0) {
        this.toast(`${player.name} has no cards to burn`);
        this.broadcastExtraInfoUpdate();
        return;
      }
      const burned = player.CardsInHand.shift();
      const middle = Math.floor(this.TheStack.length / 2);
      this.TheStack.splice(middle, 0, this.pushStackEntry(burned, true));
      this.toast(`${player.name} burns a card`);
      // The slapper may have just burned their last card while a face-card
      // challenge was active. Resolve it now so the game doesn't get stuck
      // with a defender who has no cards and no playCard event coming.
      this.maybeResolveStuckChallenge();
      this.broadcastExtraInfoUpdate();
    }
  }

  // If a face-card challenge is active but the defender (anyone other than
  // the challenger) is alive with no cards left to attempt, mark the
  // challenger as the winner immediately. transferPileTo will then
  // eliminate the now-cardless defender.
  maybeResolveStuckChallenge() {
    if (!this.faceChallenge) return false;
    const challenger = this.faceChallenge.challenger;
    const defender = this.nextToPlay;
    if (!defender || defender === challenger) return false;
    if (!defender.alive) return false;
    if (defender.CardsInHand.length > 0) return false;

    this.toast(`${challenger.name} wins the pile!`);
    this.transferPileTo(challenger);
    this.faceChallenge = null;
    this.setNextToPlay(challenger);
    return true;
  }

  // Push a fresh extraInfo snapshot to all clients. Used for mid-state
  // mutations (slap) so the UI reflects new card counts and pile state
  // without waiting for the next state change.
  broadcastExtraInfoUpdate() {
    const info = this.getStateInfo();
    this.broadcast("ratscrewExtraInfo", info.extraInfo);
  }

  // Send a transient on-board notification (rendered by the client as a
  // 1-second toast).
  toast(message) {
    this.broadcast("ratscrewToast", { message, time: Date.now() });
  }

  pushStackEntry(value, faceDown) {
    this.stackEntryId += 1;
    return { value, faceDown, id: this.stackEntryId };
  }

  // ---- Pile + turn helpers ----

  transferPileTo(player) {
    const cardValues = this.TheStack.map((entry) =>
      typeof entry === "object" ? entry.value : entry
    );
    player.CardsInHand.push(...cardValues);
    this.TheStack = [];

    // Pile cleared. Any other alive player with no cards is now eliminated.
    // Use "silent" killType so the engine's empty death message + generic
    // role-reveal alert ("X's role is Player.") don't get queued — the
    // toast above is the only notification we want.
    for (const p of this.players.array()) {
      if (p.alive && p !== player && p.CardsInHand.length === 0) {
        this.toast(`${p.name} is out!`);
        p.kill("silent", player, true);
      }
    }
  }


  // ---- Card play resolution ----

  playCard(actor) {
    // If we're in a face-card challenge and it's the defender's turn but
    // they have no cards left to attempt, the challenger wins the pile.
    if (
      this.faceChallenge &&
      actor !== this.faceChallenge.challenger &&
      actor.CardsInHand.length === 0
    ) {
      const challenger = this.faceChallenge.challenger;
      this.toast(`${challenger.name} wins the pile!`);
      this.transferPileTo(challenger);
      this.faceChallenge = null;
      this.setNextToPlay(challenger);
      return;
    }

    if (actor.CardsInHand.length === 0) return;
    const card = actor.CardsInHand.shift();
    this.TheStack.push(this.pushStackEntry(card, false));
    const rank = this.readCard(card)[0];

    if (this.isFaceCard(rank)) {
      // Played a face card — start (or escalate) a challenge.
      this.faceChallenge = {
        challenger: actor,
        attemptsLeft: this.faceCardAttempts(rank),
      };
      this.rotateNextToPlay();
      return;
    }

    if (this.faceChallenge) {
      this.faceChallenge.attemptsLeft -= 1;
      // Resolve the challenge if attempts ran out OR the defender just
      // played their last card. Without the empty-hand short-circuit, the
      // engine would wait for another playCard from a player who has none
      // — and the WinIfWithAllCards win-check (defender alive but cardless)
      // would end the game before the pile is transferred.
      if (
        this.faceChallenge.attemptsLeft <= 0 ||
        actor.CardsInHand.length === 0
      ) {
        const challenger = this.faceChallenge.challenger;
        this.toast(`${challenger.name} wins the pile!`);
        this.transferPileTo(challenger);
        this.faceChallenge = null;
        // Pile winner plays next.
        this.setNextToPlay(challenger);
        return;
      }
      // Same player keeps playing until they hit a face card or run out
      // of attempts. Do NOT rotate the turn.
      return;
    }

    this.rotateNextToPlay();
  }

  sortCards(cards) {
    for (let x = 0; x < cards.length; x++) {
      for (let y = 0; y < cards.length; y++) {
        if (
          this.readCard(cards[x], this.CardGameType)[0] >
          this.readCard(cards[y], this.CardGameType)[0]
        ) {
          let temp = cards[x];
          cards[x] = cards[y];
          cards[y] = temp;
        }
      }
    }

    return cards;
  }

  readCard(card, type) {
    let cardValue = card.split("-")[0];
    let cardSuit = card.split("-")[1];
    //if(type == "Texas Hold’em"){
    if (cardValue == "Jack") {
      cardValue = 11;
    } else if (cardValue == "Queen") {
      cardValue = 12;
    } else if (cardValue == "King") {
      cardValue = 13;
    } else if (cardValue == "Ace") {
      cardValue = 1;
    }
    //}
    return [parseInt(cardValue), cardSuit];
  }

  //DealCards
  dealCards(amount) {
    this.broadcast("cardShuffle");
    this.randomizedPlayers.forEach((player) => {
      if (player.alive) {
        let Cards = this.drawDiscardPile.drawMultiple(amount);
        player.CardsInHand.push(...Cards);
      }
    });
  }

  removeHands() {
    this.randomizedPlayers.forEach((player) => {
      for (let card of player.CardsInHand) {
        this.drawDiscardPile.discard(card);
      }
      player.CardsInHand = [];
    });
  }

  discardCommunityCards() {
    for (let card of this.CommunityCards) {
      this.drawDiscardPile.discard(card);
    }
    this.CommunityCards = [];
  }

  //DealCommunity
  DrawCommunityCards(amount) {
    this.broadcast("cardShuffle");
    let Cards = this.drawDiscardPile.drawMultiple(amount);
    this.CommunityCards.push(...Cards);
    this.sendAlert(
      `${Cards.join(", ")} have been added to the Community Cards!`
    );
  }

  addToPot(player, type, amount) {
    let soundNum = Random.randInt(0, 4);
    if (soundNum == 0) {
      this.broadcast("chips_large1");
    } else if (soundNum == 1) {
      this.broadcast("chips_large2");
    } else if (soundNum == 2) {
      this.broadcast("chips_small1");
    } else {
      this.broadcast("chips_small2");
    }

    if (type == "Bet") {
      this.sendAlert(`${player.name} bets ${amount} into the Pot!`);
      player.Chips = parseInt(player.Chips) - parseInt(amount);
      player.AmountBidding += parseInt(amount);
      this.ThePot += parseInt(amount);
      let activePlayers = this.players.filter((p) => p.alive && !p.hasFolded);
      for (let person of activePlayers) {
        person.hasHadTurn = false;
      }

      if (this.lastAmountBid < player.AmountBidding) {
        this.lastAmountBid = player.AmountBidding;
      }
    }

    if (type == "Call") {
      if (player.Chips >= this.lastAmountBid - player.AmountBidding) {
        this.sendAlert(
          `${player.name} calls and puts ${
            this.lastAmountBid - player.AmountBidding
          } into the Pot!`
        );
        this.ThePot += parseInt(this.lastAmountBid - player.AmountBidding);
        player.Chips =
          parseInt(player.Chips) - (this.lastAmountBid - player.AmountBidding);
        player.AmountBidding += parseInt(
          this.lastAmountBid - player.AmountBidding
        );
      } else if (player.Chips > 0) {
        this.sendAlert(
          `${player.name} goes All in and puts ${player.Chips} into the Pot!`
        );
        player.AmountBidding += parseInt(player.Chips);
        this.ThePot += parseInt(player.Chips);
        player.Chips = 0;
      } else {
        this.sendAlert(`${player.name} has Nothing to put into the Pot!`);
      }
    }
    /*
    if(type == "Raise"){
      if(player.Chips >= (this.lastAmountBid-player.AmountBidding)+amount){
      this.sendAlert(`${player.name} raises and puts ${(this.lastAmountBid-player.AmountBidding)+amount} into the Pot!`);
      player.Chips = player.Chips - ((this.lastAmountBid-player.AmountBidding)+amount);
      player.AmountBidding += ((this.lastAmountBid-player.AmountBidding)+amount);
      this.lastAmountBid = player.AmountBidding;
      this.ThePot += ((this.lastAmountBid-player.AmountBidding)+amount);
      }
    }
    */
  }

  addDice(player, amount, midRound, noMessage) {
    if (amount == null || amount <= 0) {
      amount = 1;
    }
    player.diceNum = player.diceNum + amount;
    if (noMessage != true) {
      this.sendAlert(`${player.name} has Gained a Dice!`);
    }
    if (midRound == true) {
      player.queueAlert(`You gain a Dice!`);
      let dice;
      let info;
      for (let x = 0; x < amount; x++) {
        dice = Math.floor(Math.random() * 6) + 1;
        player.rolledDice.push(dice);
        if (dice == 1) {
          info = ":Dice1:";
        }
        if (dice == 2) {
          info = ":Dice2:";
        }
        if (dice == 3) {
          info = ":Dice3:";
        }
        if (dice == 4) {
          info = ":Dice4:";
        }
        if (dice == 5) {
          info = ":Dice5:";
        }
        if (dice == 6) {
          info = ":Dice6:";
        }
        player.queueAlert(`You gain a ${info} !`);
        this.allDice += 1;
        this.allRolledDice.push(dice);
      }
    }
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    const simplifiedPlayers = this.simplifyPlayers(this.randomizedPlayers);
    info.extraInfo = {
      randomizedPlayers: simplifiedPlayers,
      isTheFlyingDutchman:
        this.chatName == "The Flying Dutchman" ? true : false,
      whoseTurnIsIt: this.nextToPlay?.user?.id ?? 0,
      ThePot: this.ThePot,
      RoundNumber: this.RoundNumber,
      RankNumber: this.RankNumber,
      TheStack: this.TheStack,
      faceChallenge: this.faceChallenge
        ? {
            challengerName: this.faceChallenge.challenger.name,
            attemptsLeft: this.faceChallenge.attemptsLeft,
          }
        : null,
      sumToTen: this.sumToTen,
      marriageRule: this.marriageRule,
    };
    return info;
  }

  getGameTypeOptions() {
    return {
      MaxRounds: this.MaxRounds,
      sumToTen: this.sumToTen,
      marriageRule: this.marriageRule,
    };
  }

  simplifyPlayers(players) {
    const simplified = [];
    for (const key in players) {
      if (Object.prototype.hasOwnProperty.call(players, key)) {
        const player = players[key];
        simplified.push({
          playerId: player.id,
          userId: player.user.id,
          playerName: player.name,
          CardsInHand: player.CardsInHand,
          Chips: player.Chips,
          Bets: player.AmountBidding,
          Folded: player.hasFolded,
        });
      }
    }
    return simplified;
  }

  // process player leaving immediately
  async playerLeave(player) {
    await super.playerLeave(player);

    if (this.started && !this.finished) {
      const deadPlayerIndex = this.randomizedPlayers.findIndex(
        (randomizedPlayer) => randomizedPlayer.id === player.id
      );
      this.randomizedPlayers = this.randomizedPlayers.filter(
        (rPlayer) => rPlayer.id !== player.id
      );

      let action = new Action({
        actor: player,
        target: player,
        game: this,
        run: function () {
          this.target.kill("leave", this.actor, true);
        },
      });

      if (player.alive && player != this.hostPlayer) {
      } else {
        this.sendAlert(`${player.name} left, and will surely be missed.`);
      }

      this.instantAction(action);
    } else if (this.finished) {
      this.sendAlert(`${player.name} left, and will surely be missed.`);
    }
  }

  async vegPlayer(player) {
    super.vegPlayer(player);

    if (
      this.started &&
      !this.finished &&
      this.randomizedPlayers.includes(player)
    ) {
      const deadPlayerIndex = this.randomizedPlayers.findIndex(
        (randomizedPlayer) => randomizedPlayer.id === player.id
      );
      this.randomizedPlayers = this.randomizedPlayers.filter(
        (rPlayer) => rPlayer.id !== player.id
      );
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
    await super.endGame(winners);
  }
};
