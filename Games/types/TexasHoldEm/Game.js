const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const DrawDiscardPile = require("./DrawDiscardPile");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");

const Random = require("../../../lib/Random");

module.exports = class TexasHoldEmGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Texas Hold Em";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Place Bets",
        length: options.settings.stateLengths["Place Bets"],
      },
      {
        name: "Showdown",
        length: options.settings.stateLengths["Showdown"],
        skipChecks: [() => this.Phase != "Showdown"],
      },
    ];

    //settings
    /*
    this.wildOnes = options.settings.wildOnes;
    this.spotOn = options.settings.spotOn;
    */
    this.drawDiscardPile = new DrawDiscardPile();
    this.drawDiscardPile.initCards();
    this.startingChips = parseInt(options.settings.startingChips);
    this.minimumBet = parseInt(options.settings.minimumBet);
    this.MaxRounds = parseInt(options.settings.MaxRounds) || 0;
    this.CardGameType = "Texas Hold’em";

    //VARIABLES
    this.randomizedPlayers = []; //All players after they get randomized. Used for showing players and their dice on left side of screen.
    this.randomizedPlayersCopy = []; //copy of above, but players don't get removed on dying / leaving. Used for deciding next player's
    // turn, since variable above would mess up indexes when players got removed.
    this.currentIndex = 0; //Index of player's current turn.

    //information about last turn's bid
    this.lastAmountBid = 0;
    this.lastBidder = null;

    //hand history of past rounds for the dropdown UI
    this.handHistory = [];

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

  // Suppress the generic role-reveal alert ("X's role is Player.") — every
  // poker player is just a "Player," there's no role to spoil.
  isNoReveal() {
    return true;
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
    if (this.startingChips) {
      this.sendAlert(`Everyone starts with ${this.startingChips} chips.`);
    }
    if (this.MaxRounds >= 1) {
      this.sendAlert(
        `The player with the most Chips wins after Round ${this.MaxRounds}.`
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
    if (this.CardGameType == "Texas Hold’em") {
      this.CommunityCards = [];
      this.RoundNumber = 0;
      this.drawDiscardPile.shuffle();
      this.setupNextRoundTexas();
    }
    this.startRoundRobin();

    super.start();
  }

  //Start: Randomizes player order, and gives the microphone to first one.
  setupNextRoundTexas() {
    this.ThePot = parseInt(0);
    this.randomizedPlayers.forEach((player) => {
      player.hasFolded = false;
      player.hasHadTurn = false;
      player.Score = 0;
      player.AmountBidding = parseInt(0);
      player.ScoreType = null;
      player.ShowdownCards = [];
    });
    this.randomizedPlayers.forEach((player) => {
      if (player.Chips < this.minimumBet) {
        player.kill();
      }
    });
    this.Phase = "First Bets";
    if (this.RoundNumber == 0) {
      this.Dealer = this.randomizedPlayersCopy[0];
      this.SmallBlind = this.randomizedPlayersCopy[1];
      this.BigBlind =
        this.randomizedPlayersCopy[(1 + 1) % this.randomizedPlayersCopy.length];
    } else {
      for (let x = 1; x < this.randomizedPlayersCopy.length; x++) {
        if (
          this.randomizedPlayersCopy[
            (this.randomizedPlayersCopy.indexOf(this.Dealer) + x) %
              this.randomizedPlayersCopy.length
          ].alive
        ) {
          this.Dealer =
            this.randomizedPlayersCopy[
              (this.randomizedPlayersCopy.indexOf(this.Dealer) + x) %
                this.randomizedPlayersCopy.length
            ];
          for (let y = 1; y < this.randomizedPlayersCopy.length; y++) {
            if (
              this.randomizedPlayersCopy[
                (this.randomizedPlayersCopy.indexOf(this.Dealer) + y) %
                  this.randomizedPlayersCopy.length
              ].alive
            ) {
              this.SmallBlind =
                this.randomizedPlayersCopy[
                  (this.randomizedPlayersCopy.indexOf(this.Dealer) + y) %
                    this.randomizedPlayersCopy.length
                ];

              for (let w = 1; w < this.randomizedPlayersCopy.length; w++) {
                if (
                  this.randomizedPlayersCopy[
                    (this.randomizedPlayersCopy.indexOf(this.SmallBlind) + w) %
                      this.randomizedPlayersCopy.length
                  ].alive
                ) {
                  this.BigBlind =
                    this.randomizedPlayersCopy[
                      (this.randomizedPlayersCopy.indexOf(this.SmallBlind) +
                        w) %
                        this.randomizedPlayersCopy.length
                    ];
                  this.currentIndex =
                    parseInt(
                      this.randomizedPlayersCopy.indexOf(this.BigBlind)
                    ) % this.randomizedPlayersCopy.length;

                  //Bidder
                  break;
                }
              } //BigBlind

              break;
            } //SmallBlind
          }
          break;
        } //Dealer
      }
    }
    this.SmallBlind.Chips -= Math.ceil(this.minimumBet / 2.0);
    this.SmallBlind.AmountBidding = Math.ceil(this.minimumBet / 2.0);
    this.ThePot += Math.ceil(this.minimumBet / 2.0);
    this.lastAmountBid = Math.ceil(this.minimumBet / 2.0);
    this.BigBlind.Chips -= this.minimumBet;
    this.BigBlind.AmountBidding = this.minimumBet;
    this.ThePot += this.minimumBet;
    this.lastAmountBid = this.minimumBet;
    this.dealCards(2);
  }

  startRoundRobin() {
    while (true) {
      let nextPlayer = this.randomizedPlayersCopy[this.currentIndex];
      if (nextPlayer.alive && nextPlayer.hasFolded != true) {
        nextPlayer.howManySelected = false;
        nextPlayer.whichFaceSelected = false;
        nextPlayer.holdItem("Microphone");
        return;
      }
    }
  }

  //Called each round, cycles between players.
  incrementCurrentIndex() {
    this.currentIndex =
      (this.currentIndex + 1) % this.randomizedPlayersCopy.length;
  }

  //After someone uses microphone, it passes it to the next player.
  incrementState() {
    let previousState = this.getStateName();

    if (previousState == "Place Bets") {
      console.log(this.spectatorMeetFilter);
      let tempPlayers = this.randomizedPlayersCopy.filter(
        (p) =>
          p.hasHadTurn != true && p.alive && p.hasFolded != true && p.Chips > 0
      );
      let playersInGame = this.randomizedPlayersCopy.filter(
        (p) => p.alive && p.hasFolded != true
      );
      if (playersInGame.length == 1) {
        this.RoundNumber++;
        const foldWinner = playersInGame[0];
        const foldPot = parseInt(this.ThePot);
        this.sendAlert(
          `${foldWinner.name} has Won ${foldPot} from The Pot by not folding!`
        );
        foldWinner.Chips += foldPot;

        // Record a redacted hand history entry — winner's hole cards stay
        // private when the round is decided by folds only.
        this.handHistory.push({
          winnerId: foldWinner.user.id,
          winnerName: foldWinner.name,
          scoreType: null,
          showdownCards: null,
          holeCards: null,
          communityCards: [...this.CommunityCards],
          pot: foldPot,
          revealed: false,
        });

        this.removeHands();
        this.discardCommunityCards();
        this.setupNextRoundTexas();
      } else if (tempPlayers.length > 0) {
        playersInGame = playersInGame.filter((p) => p.Chips > 0);
        while (playersInGame.length > 0) {
          this.incrementCurrentIndex();

          let nextPlayer = this.randomizedPlayersCopy[this.currentIndex];
          if (
            nextPlayer.alive &&
            nextPlayer.hasFolded != true &&
            nextPlayer.Chips > 0
          ) {
            nextPlayer.holdItem("Microphone");
            break;
          }
        }
      } else if (this.Phase == "First Bets") {
        this.lastAmountBid = 0;
        this.Phase = "The Flop";
        this.randomizedPlayers.forEach((player) => {
          player.hasHadTurn = false;
          player.AmountBidding = 0;
        });
        this.DrawCommunityCards(3);
        this.currentIndex =
          this.randomizedPlayersCopy.indexOf(this.Dealer) %
          this.randomizedPlayersCopy.length;
        playersInGame = playersInGame.filter((p) => p.Chips > 0);
        while (playersInGame.length > 0) {
          this.incrementCurrentIndex();

          let nextPlayer = this.randomizedPlayersCopy[this.currentIndex];
          if (
            nextPlayer.alive &&
            nextPlayer.hasFolded != true &&
            nextPlayer.Chips > 0
          ) {
            nextPlayer.holdItem("Microphone");
            break;
          }
        }
      } else if (this.Phase == "The Flop" || this.Phase == "The Turn") {
        this.lastAmountBid = 0;
        if (this.Phase == "The Flop") {
          this.Phase = "The Turn";
        } else {
          this.Phase = "The River";
        }
        this.randomizedPlayers.forEach((player) => {
          player.hasHadTurn = false;
          player.AmountBidding = 0;
        });
        this.DrawCommunityCards(1);
        this.currentIndex =
          this.randomizedPlayersCopy.indexOf(this.Dealer) %
          this.randomizedPlayersCopy.length;
        playersInGame = playersInGame.filter((p) => p.Chips > 0);
        while (playersInGame.length > 0) {
          this.incrementCurrentIndex();

          let nextPlayer = this.randomizedPlayersCopy[this.currentIndex];
          if (
            nextPlayer.alive &&
            nextPlayer.hasFolded != true &&
            nextPlayer.Chips > 0
          ) {
            nextPlayer.holdItem("Microphone");
            break;
          }
        }
      } else if (this.Phase == "The River") {
        this.Phase = "Showdown";
        this.randomizedPlayers.forEach((player) => {
          if (player.alive != true) {
            return;
          }
          if (player.hasFolded == true) {
            return;
          }
          player.hasHadTurn = false;
          player.AmountBidding = 0;
        });
      }
    } else if (previousState == "Showdown") {
      this.AwardRoundWinner();
      this.RoundNumber++;
      this.removeHands();
      this.discardCommunityCards();
      this.setupNextRoundTexas();
    }

    super.incrementState();
  }

  // Showdown has no meetings, so the default checkAllMeetingsReady would
  // see "no meetings, all ready" and advance instantly. Hold the state for
  // its full configured length so players can see the revealed hole cards.
  createNextStateTimer(stateInfo) {
    if (this.getStateName() === "Showdown") {
      this.createTimer("main", stateInfo.length, () => this.gotoNextState());
      return;
    }
    super.createNextStateTimer(stateInfo);
  }

  checkAllMeetingsReady() {
    if (this.getStateName() === "Showdown") return;
    super.checkAllMeetingsReady();
  }

  // Score exactly 5 cards. Returns { score, scoreType, cards }.
  scoreFiveCards(cards) {
    const sortedCards = this.sortCards([...cards]);
    let allSameSuit = true;
    let streight = true;
    let lowAce = false;
    const counts = new Array(13).fill(0);

    for (const card of sortedCards) {
      const tempCard = this.readCard(card);
      counts[tempCard[0] - 2]++;
      for (const cardB of sortedCards) {
        const tempCardB = this.readCard(cardB);
        if (card === sortedCards[0] && card !== cardB) {
          if (
            parseInt(tempCard[0] - tempCardB[0]) !==
            parseInt(sortedCards.indexOf(cardB))
          ) {
            // Low ace (A-2-3-4-5) — sorted desc that becomes [A,5,4,3,2]
            if (
              this.readCard(sortedCards[0])[0] === 14 &&
              this.readCard(sortedCards[1])[0] === 5 &&
              this.readCard(sortedCards[2])[0] === 4 &&
              this.readCard(sortedCards[3])[0] === 3 &&
              this.readCard(sortedCards[4])[0] === 2
            ) {
              streight = true;
              lowAce = true;
            } else {
              streight = false;
            }
          }
        }
        if (card !== cardB && tempCard[1] !== tempCardB[1]) {
          allSameSuit = false;
        }
      }
    }

    let score = 0;
    let scoreType = "High Card";
    let four = false;
    let five = false;
    let three = false;
    let fiveValue;
    let fourValue;
    let threeValue;
    let pairs = 0;
    const pairValues = [];

    for (let x = 0; x < counts.length; x++) {
      if (counts[x] === 5) {
        five = true;
        fiveValue = x + 2;
      }
      if (counts[x] === 4) {
        four = true;
        fourValue = x + 2;
      }
      if (counts[x] === 3) {
        three = true;
        threeValue = x + 2;
      }
      if (counts[x] === 2) {
        pairs += 1;
        pairValues.push(x + 2);
      }
    }

    if (five && allSameSuit) {
      scoreType = "Five Flush";
      score = 13000 + fiveValue;
    } else if (three && pairs > 0 && allSameSuit) {
      scoreType = "Flush house";
      score = 12000 + threeValue + pairValues[0];
    } else if (five) {
      scoreType = "Five of a kind";
      score = 11000 + fiveValue;
    } else if (
      streight &&
      allSameSuit &&
      this.readCard(sortedCards[0])[0] === 14 &&
      !lowAce
    ) {
      scoreType = "Royal Flush";
      score = 10000;
    } else if (streight && allSameSuit) {
      scoreType = "Straight flush";
      score = 9000 + this.readCard(sortedCards[0])[0];
    } else if (four) {
      scoreType = "Four of a kind";
      score = 8000 + fourValue;
    } else if (three && pairs > 0) {
      scoreType = "Full house";
      score = 7000 + threeValue + pairValues[0];
    } else if (allSameSuit) {
      scoreType = "Flush";
      score = 6000 + this.readCard(sortedCards[0])[0];
    } else if (streight) {
      scoreType = "Straight";
      score = 5000 + this.readCard(sortedCards[0])[0];
    } else if (three) {
      scoreType = "Three of a kind";
      score = 4000 + threeValue;
    } else if (pairs > 1) {
      scoreType = "Two Pairs";
      score = 3000 + pairValues[0] + pairValues[1];
    } else if (pairs > 0) {
      scoreType = "Pair";
      score = 2000 + pairValues[0];
    } else {
      score = this.readCard(sortedCards[0])[0];
    }

    return { score, scoreType, cards: sortedCards };
  }

  // Pick the best 5-card subset out of N cards (handles 5..7).
  bestHandFromCards(cards) {
    if (cards.length <= 5) return this.scoreFiveCards(cards);
    let best = null;
    const recurse = (start, picked) => {
      if (picked.length === 5) {
        const result = this.scoreFiveCards(picked);
        if (!best || result.score > best.score) best = result;
        return;
      }
      for (let i = start; i < cards.length; i++) {
        picked.push(cards[i]);
        recurse(i + 1, picked);
        picked.pop();
      }
    };
    recurse(0, []);
    return best;
  }

  AwardRoundWinner() {
    const contenders = this.randomizedPlayers.filter(
      (p) => p.alive && p.hasFolded != true
    );
    if (contenders.length === 0) return;

    for (const player of contenders) {
      const available = [...player.CardsInHand, ...this.CommunityCards];
      if (available.length < 5) {
        player.Score = 0;
        player.ScoreType = "No Hand";
        continue;
      }
      const best = this.bestHandFromCards(available);
      player.ShowdownCards = best.cards;
      player.Score = best.score;
      player.ScoreType = best.scoreType;
    }

    let highest = [contenders[0]];
    for (let i = 1; i < contenders.length; i++) {
      const player = contenders[i];
      if (player.Score > highest[0].Score) {
        highest = [player];
      } else if (player.Score === highest[0].Score) {
        highest.push(player);
      }
    }

    const share = Math.floor(this.ThePot / highest.length);
    for (const player of highest) {
      player.Chips += parseInt(share);
      this.sendAlert(
        `${player.name} wins ${share} chips from the Pot with a ${player.ScoreType}!`
      );
      this.broadcast("pokerToast", {
        message: `${player.name} wins ${share} with ${player.ScoreType}`,
        time: Date.now(),
      });

      // Record a fully revealed hand history entry for this showdown winner.
      this.handHistory.push({
        winnerId: player.user.id,
        winnerName: player.name,
        scoreType: player.ScoreType,
        showdownCards: [...(player.ShowdownCards || [])],
        holeCards: [...(player.CardsInHand || [])],
        communityCards: [...this.CommunityCards],
        pot: parseInt(share),
        revealed: true,
      });
    }
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
      cardValue = 14;
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
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    const simplifiedPlayers = this.simplifyPlayers(this.randomizedPlayers);
    const currentPlayer =
      this.randomizedPlayersCopy?.[this.currentIndex] ?? null;
    info.extraInfo = {
      randomizedPlayers: simplifiedPlayers,
      isTheFlyingDutchman:
        this.chatName == "The Flying Dutchman" ? true : false,
      whoseTurnIsIt: currentPlayer?.user.id ?? 0,
      whoseTurnName: currentPlayer?.name ?? "",
      ThePot: this.ThePot,
      RoundNumber: this.RoundNumber,
      Phase: this.Phase,
      CommunityCards: this.CommunityCards,
      dealerId: this.Dealer?.user.id ?? null,
      smallBlindId: this.SmallBlind?.user.id ?? null,
      bigBlindId: this.BigBlind?.user.id ?? null,
      lastAmountBid: this.lastAmountBid,
      minimumBet: this.minimumBet,
      handHistory: this.handHistory,
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
          // Folded players' hole cards are never sent to clients — that data
          // is private once they leave the round.
          CardsInHand: player.hasFolded ? [] : player.CardsInHand,
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
      player.hasFolded = true;
      this.sendAlert(`${player.name} vegged and was folded out of the round.`);
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
