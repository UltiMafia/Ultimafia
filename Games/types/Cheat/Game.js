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

    this.type = "Card Games";
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
    if (this.startingChips) {
      this.sendAlert(`Everyone starts with ${this.startingChips} chips.`);
    }
    if(this.MaxRounds >= 1){
      this.sendAlert(`The player with the most Chips wins after Round ${this.MaxRounds}.`);
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
    this.sendAlert(
      `${this.SmallBlind.name} is The Small Blind and bets ${Math.ceil(
        this.minimumBet / 2.0
      )}.`
    );
    this.SmallBlind.Chips -= Math.ceil(this.minimumBet / 2.0);
    this.SmallBlind.AmountBidding = Math.ceil(this.minimumBet / 2.0);
    this.ThePot += Math.ceil(this.minimumBet / 2.0);
    this.lastAmountBid = Math.ceil(this.minimumBet / 2.0);
    this.sendAlert(
      `${this.BigBlind.name} is The Big Blind and bets ${this.minimumBet}.`
    );
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
        this.sendAlert(`The Round has Concluded`);
        this.RoundNumber++;
        this.sendAlert(
          `${playersInGame[0].name} has Won ${this.ThePot} from The Pot by not folding!`
        );
        playersInGame[0].Chips += parseInt(this.ThePot);

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
          player.holdItem("ShowdownTime");
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

  AwardRoundWinner() {
    this.randomizedPlayers.forEach((player) => {
      if (player.alive != true) {
        return;
      }
      if (player.hasFolded == true) {
        return;
      }
      let allSameSuit = true;
      let streight = true;
      let lowAce = false;
      var counts = [
        0, //2-0
        0, //3-1
        0, //4-2
        0, //5-3
        0, //6-4
        0, //7-5
        0, //8-6
        0, //9-7
        0, //10-8
        0, //Jack-9
        0, //Queen-10
        0, //King-11
        0, //Ace-12
      ];

      player.ShowdownCards = this.sortCards(player.ShowdownCards);
      this.sendAlert(`${player.name} uses ${player.ShowdownCards.join(", ")}!`);
      for (let card of player.ShowdownCards) {
        let tempCard = this.readCard(card);
        if (!counts[tempCard[0]]) {
          counts[tempCard[0]] = 0;
        }
        counts[tempCard[0] - 2]++;
        for (let cardB of player.ShowdownCards) {
          let tempCardB = this.readCard(cardB);
          if (card == player.ShowdownCards[0]) {
            if (card != cardB) {
              //this.sendAlert(`${card} ${tempCard[0]}-${cardB} ${tempCardB[0]} is ${tempCard[0]-tempCardB[0]} Index ${player.ShowdownCards.indexOf(cardB)}!`);
              if (
                parseInt(tempCard[0] - tempCardB[0]) !=
                parseInt(player.ShowdownCards.indexOf(cardB))
              ) {
                //Low Ace Check
                if (
                  this.readCard(player.ShowdownCards[0])[0] == 14 &&
                  this.readCard(player.ShowdownCards[1])[0] == 5 &&
                  this.readCard(player.ShowdownCards[2])[0] == 4 &&
                  this.readCard(player.ShowdownCards[3])[0] == 3 &&
                  this.readCard(player.ShowdownCards[4])[0] == 2
                ) {
                  streight = true;
                  lowAce = true;
                } else {
                  streight = false;
                }
              }
            }
          }
          if (card != cardB) {
            if (tempCard[1] != tempCardB[1]) {
              allSameSuit = false;
            }
          }
        }
      }
      let score = 0;
      let four = false;
      let five = false;
      let fiveValue;
      let fourValue;
      let three = false;
      let threeValue;
      let pairs = 0;
      let pairValues = [];

      for (let x = 0; x < counts.length; x++) {
        //this.sendAlert(`Value ${x+2} Amounts ${counts[x]}!`);
        if (counts[x] == 5) {
          five = true;
          fiveValue = x + 2;
        }
        if (counts[x] == 4) {
          four = true;
          fourValue = x + 2;
        }
        if (counts[x] == 3) {
          three = true;
          threeValue = x + 2;
        }
        if (counts[x] == 2) {
          pairs += 1;
          pairValues.push(x + 2);
        }
      }

      if (five == true && allSameSuit == true) {
        player.ScoreType = "Five Flush";
        score += 13000;
        score += fiveValue;
      } else if (three == true && pairs > 0 && allSameSuit == true) {
        player.ScoreType = "Flush house";
        score += 12000;
        score += threeValue;
        score += pairValues[0];
      } else if (five == true) {
        player.ScoreType = "Five of a kind";
        score += 11000;
        score += fiveValue;
      } else if (
        streight == true &&
        allSameSuit == true &&
        this.readCard(player.ShowdownCards[0])[0] == 14 &&
        lowAce != true
      ) {
        player.ScoreType = "Royal Flush";
        score += 10000;
      } else if (streight == true && allSameSuit == true) {
        player.ScoreType = "Straight flush";
        score += 9000;
        score += this.readCard(player.ShowdownCards[0])[0];
      } else if (four == true) {
        player.ScoreType = "Four of a kind";
        score += 8000;
        score += fourValue;
      } else if (three == true && pairs > 0) {
        player.ScoreType = "Full house";
        score += 7000;
        score += threeValue;
        score += pairValues[0];
      } else if (allSameSuit == true) {
        player.ScoreType = "Flush";
        score += 6000;
        score += this.readCard(player.ShowdownCards[0])[0];
      } else if (streight == true) {
        player.ScoreType = "Straight";
        score += 5000;
        score += this.readCard(player.ShowdownCards[0])[0];
      } else if (three == true) {
        player.ScoreType = "Three of a kind";
        score += 4000;
        score += threeValue;
      } else if (pairs > 1) {
        player.ScoreType = "Two Pairs";
        score += 3000;
        score += pairValues[0];
        score += pairValues[1];
      } else if (pairs > 0) {
        player.ScoreType = "Pair";
        score += 2000;
        score += pairValues[0];
      } else {
        player.ScoreType = "High Card";
        score += this.readCard(player.ShowdownCards[0])[0];
      }
      player.Score = score;
    });
    let highest = [
      this.randomizedPlayers.filter((p) => p.alive && p.hasFolded != true)[0],
    ];
    for (let player of this.randomizedPlayers.filter(
      (p) => p.alive && p.hasFolded != true
    )) {
      if (player.Score > highest[0].Score) {
        highest = [player];
      } else if (player != highest[0] && player.Score == highest[0].Score) {
        highest.push(player);
      }
    }
    this.sendAlert(`The Round has Concluded`);
    for (let player of highest) {
      this.sendAlert(
        `${player.name} has Won ${Math.floor(
          this.ThePot / highest.length
        )} from The Pot with a ${player.ScoreType}!`
      );
      //this.sendAlert(`${player.name} had a score of ${player.Score}!`);
      player.Chips += parseInt(Math.floor(this.ThePot / highest.length));
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
        player.sendAlert(`${Cards.join(", ")} have been added to your Hand!`);
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
    if(soundNum == 0){
      this.broadcast("chips_large1");
    }
    else if(soundNum == 1){
      this.broadcast("chips_large2");
    }
    else if(soundNum == 2){
      this.broadcast("chips_small1");
    }
    else{
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
      whoseTurnIsIt:
        this.randomizedPlayersCopy?.[this.currentIndex]?.user.id ?? 0,
      ThePot: this.ThePot,
      RoundNumber: this.RoundNumber,
      Phase: this.Phase,
      CommunityCards: this.CommunityCards,
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

      this.sendAlert(
        `${player.name} vegged, but their ${player.rolledDice.length} dice will still count towards this round's total.`
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
