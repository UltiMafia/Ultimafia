const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const DrawDiscardPile = require("./DrawDiscardPile");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");

const Random = require("../../../lib/Random");

module.exports = class CheatGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Cheat";
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

    //settings
    /*
    this.wildOnes = options.settings.wildOnes;
    this.spotOn = options.settings.spotOn;
    */
    this.drawDiscardPile = new DrawDiscardPile();
    this.drawDiscardPile.initCards();
    this.MaxRounds = parseInt(options.settings.MaxRounds) || 0;
    this.CardGameType = "Cheat";

    //VARIABLES
    this.randomizedPlayers = []; //All players after they get randomized. Used for showing players and their dice on left side of screen.
    this.randomizedPlayersCopy = []; //copy of above, but players don't get removed on dying / leaving. Used for deciding next player's
    // turn, since variable above would mess up indexes when players got removed.
    this.currentIndex = 0; //Index of player's current turn.
    this.nextToPlay = null; // Player whose turn it currently is.
    this.stackEntryId = 0; // Monotonic id for each card placed in TheStack.
    this.lastPlay = null; // { player, cards: [...], claimedRank } — the most
    // recent play, eligible for a Call Lie challenge.

    //information about last turn's bid
    this.lastAmountBid = 0;
    this.lastFaceBid = 1;
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
    /*
    if (this.wildOnes) {
      this.sendAlert(
        `WILD ONES are enabled. Ones will count towards any face amount.`
      );
    }
    if (this.spotOn) {
      this.sendAlert(
        `SPOT ON is enabled. On your turn, you can guess that the previous bidder called exact amount. If you're right, everyone else will lose a die.`
      );
    }
    */
    if (this.MaxRounds >= 1) {
      this.sendAlert(
        `The player with the least Cards wins after Round ${this.MaxRounds}.`
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
    if (this.CardGameType == "Cheat") {
      this.TheStack = [];
      this.RankNumber = 1;
      this.drawDiscardPile.shuffle();
      this.setupCheat();
    }
    this.startRoundRobin();

    super.start();
  }

  //Start: Randomizes player order, and gives the microphone to first one.
  setupCheat() {
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
    this.Phase = "First Bets";
    if (this.RoundNumber == 0) {
      this.Dealer = this.randomizedPlayersCopy[0];
      this.SmallBlind = this.randomizedPlayersCopy[1];
      this.BigBlind =
        this.randomizedPlayersCopy[(1 + 1) % this.randomizedPlayersCopy.length];
    }

    this.ThePot += this.minimumBet;
    this.lastAmountBid = this.minimumBet;
    let cardAmount = Math.floor(52 / this.randomizedPlayersCopy.length);

    this.dealCards(cardAmount);
  }

  startRoundRobin() {
    for (let i = 0; i < this.randomizedPlayersCopy.length; i++) {
      const candidate = this.randomizedPlayersCopy[this.currentIndex];
      if (candidate.alive && candidate.hasFolded != true) {
        candidate.howManySelected = false;
        candidate.whichFaceSelected = false;
        this.nextToPlay = candidate;
        return;
      }
      this.currentIndex =
        (this.currentIndex + 1) % this.randomizedPlayersCopy.length;
    }
  }

  // Pick the next player around the round-robin who is alive and still has cards.
  // A player with an empty hand is skipped — they can re-enter rotation if a
  // Call Lie hands them the stack.
  rotateNextToPlay() {
    const order = this.randomizedPlayersCopy;
    if (!order || order.length === 0) return;
    if (!this.nextToPlay) {
      this.nextToPlay = order[0];
      return;
    }
    const startIdx = Math.max(order.indexOf(this.nextToPlay), 0);
    for (let i = 1; i <= order.length; i++) {
      const candidate = order[(startIdx + i) % order.length];
      if (
        candidate &&
        candidate.alive &&
        candidate.CardsInHand &&
        candidate.CardsInHand.length > 0
      ) {
        this.nextToPlay = candidate;
        this.currentIndex = (startIdx + i) % order.length;
        return;
      }
    }
  }

  rankLabel(n) {
    if (n === 1) return "Ace";
    if (n === 11) return "Jack";
    if (n === 12) return "Queen";
    if (n === 13) return "King";
    return String(n);
  }

  // State cycling is driven by `playCheatCards` (called from the active
  // player's instant Submit action). incrementState stays a passthrough so
  // we don't double-advance the rank/turn.
  incrementState() {
    super.incrementState();
  }

  // ---- Play mechanic ----

  pushStackEntry(value, player, claimedRank) {
    this.stackEntryId += 1;
    return {
      value,
      id: this.stackEntryId,
      playerId: player ? player.id : null,
      claimedRank: claimedRank ?? null,
    };
  }

  // Resolves an instant play by the active player. Mirrors ratscrew's
  // playCard/applySlap pattern: mutates state inline, advances `nextToPlay`,
  // pushes a fresh extraInfo snapshot, then forces a state cycle so the
  // next player's Play Card / Submit meetings open immediately.
  playCheatCards(actor, cards) {
    if (!cards || cards.length === 0) return;
    const claimedRank = this.RankNumber;
    const cardsCopy = [...cards];

    // Close the previous play's call-lie window. If its author emptied
    // their hand and no one called lie before this new play, they've
    // survived the challenge window and win.
    if (
      this.lastPlay &&
      this.lastPlay.player !== actor &&
      this.lastPlay.player.CardsInHand.length === 0
    ) {
      this.lastPlay.player.HasNoCards = true;
    }

    for (let card of cardsCopy) {
      const idx = actor.CardsInHand.indexOf(card);
      if (idx !== -1) actor.CardsInHand.splice(idx, 1);
    }

    for (let card of cardsCopy) {
      this.TheStack.push(this.pushStackEntry(card, actor, claimedRank));
    }

    this.lastPlay = {
      player: actor,
      cards: cardsCopy,
      claimedRank,
    };

    this.RoundNumber++;
    this.RankNumber++;
    if (this.RankNumber > 13) this.RankNumber = 1;

    this.rotateNextToPlay();

    this.broadcastExtraInfoUpdate();
    // No explicit gotoNextState here — Submit's instant action returns to
    // instantAction() which calls checkAllMeetingsReady, and the state
    // cycles naturally (Play Card has its multi votes, Submit just
    // finished, no other blockers).
  }

  applyCallLie(caller) {
    if (!this.lastPlay) {
      this.toast(`${caller.name} called lie — nothing to challenge`);
      return;
    }
    if (this.lastPlay.player === caller) {
      // Defensive — shouldMeet should already exclude the lastPlay player.
      return;
    }

    const liar = this.lastPlay.player;
    const cards = this.lastPlay.cards;
    const claimedRank = this.lastPlay.claimedRank;

    let actuallyLied = false;
    for (let card of cards) {
      const rank = this.readCard(card)[0];
      if (rank !== claimedRank) {
        actuallyLied = true;
        break;
      }
    }

    const stackCards = this.TheStack.map((entry) =>
      typeof entry === "object" ? entry.value : entry
    );
    const taker = actuallyLied ? liar : caller;
    taker.CardsInHand.push(...stackCards);

    // Honest play that emptied the liar's hand: the miscall locks in
    // their win — they survived the call-lie window.
    if (!actuallyLied && liar.CardsInHand.length === 0) {
      liar.HasNoCards = true;
    }

    // Tell clients which cards were just revealed so they can flip the
    // played pile face-up briefly before it disappears. The `time` field
    // lets the client dedup replays from the socket wrapper's message
    // history.
    this.broadcast("cheatReveal", {
      cards,
      claimedRank,
      liarName: liar.name,
      callerName: caller.name,
      takerName: taker.name,
      wasLying: actuallyLied,
      stackSize: stackCards.length,
      time: Date.now(),
    });

    this.sendAlert(
      `${caller.name} calls ${liar.name} a liar! And they were ${
        actuallyLied ? "right" : "wrong"
      }! ${taker.name} takes the stack of ${stackCards.length} card${
        stackCards.length === 1 ? "" : "s"
      }.`
    );

    this.toast(
      actuallyLied
        ? `${caller.name} caught ${liar.name} lying!`
        : `${caller.name} miscalled — they take the stack`
    );

    this.TheStack = [];
    this.lastPlay = null;
    this.broadcastExtraInfoUpdate();
  }

  broadcastExtraInfoUpdate() {
    const info = this.getStateInfo();
    this.broadcast("cheatExtraInfo", info.extraInfo);
  }

  toast(message) {
    this.broadcast("cheatToast", { message, time: Date.now() });
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
      lastPlay: this.lastPlay
        ? {
            playerId: this.lastPlay.player.id,
            playerUserId: this.lastPlay.player.user?.id ?? 0,
            playerName: this.lastPlay.player.name,
            cardCount: this.lastPlay.cards.length,
            claimedRank: this.lastPlay.claimedRank,
          }
        : null,
    };
    return info;
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

    if (this.lastPlay && this.lastPlay.player === player) {
      this.lastPlay = null;
    }

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

  getGameTypeOptions() {
    return {
      startingChips: this.startingChips,
      minimumBet: this.minimumBet,
      MaxRounds: this.MaxRounds,
    };
  }
};
