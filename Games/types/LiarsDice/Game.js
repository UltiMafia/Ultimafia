const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");

const Random = require("../../../lib/Random");

module.exports = class LiarsDiceGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Liars Dice";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Guess Dice",
        length: options.settings.stateLengths["Guess Dice"],
      },
    ];

    //settings
    this.wildOnes = options.settings.wildOnes;
    this.spotOn = options.settings.spotOn;
    this.startingDice = options.settings.startingDice;

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
    if (this.startingDice) {
      this.sendAlert(`Everyone starts with ${this.startingDice} dice.`);
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
      player.diceNum = parseInt(this.startingDice);
    });

    // super.start();
    this.rollDice();
    this.startRoundRobin();

    super.start();
  }

  //Start: Randomizes player order, and gives the microphone to first one.
  startRoundRobin() {
    while (true) {
      let nextPlayer = this.randomizedPlayersCopy[this.currentIndex];
      if (nextPlayer.alive) {
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

    if (previousState == "Guess Dice") {
      console.log(this.spectatorMeetFilter);
      while (true) {
        this.incrementCurrentIndex();

        let nextPlayer = this.randomizedPlayersCopy[this.currentIndex];
        if (nextPlayer.alive) {
          nextPlayer.holdItem("Microphone");
          break;
        }
      }
    }

    super.incrementState();
  }

  //Checks whether bid was a lie, removes dice, then passes onto next player.
  callALie(player) {
    this.sendAlert(`(LIE CALL) ${player.name} calls a lie!`);
    if (this.lastBidder !== null) {
      this.sendAlert(
        `(LIE CALL) Last bid was ${this.lastAmountBid}x  :dice${this.lastFaceBid}: 's by ${this.lastBidder.name}.`
      );

      let diceCount = 0;

      this.allRolledDice.forEach((die) => {
        if (die == this.lastFaceBid) {
          diceCount++;
        }
        if (this.wildOnes && die == 1 && this.lastFaceBid != 1) {
          diceCount++;
        }
      });
      this.events.emit(
        "LieCall",
        player,
        diceCount < this.lastAmountBid,
        this.lastBidder
      );
      if (diceCount >= this.lastAmountBid) {
        if (this.chatName == "Casino") {
          this.sendAlert(
            `(LIE CALL) There are ${diceCount}x  :dice${this.lastFaceBid}: 's. Bid was correct, ${player.name} loses a die.`
          );
        } else if (this.chatName == "The Flying Dutchman") {
          this.sendAlert(
            `(LIE CALL) There are ${diceCount}x  :dice${this.lastFaceBid}: 's. ${this.lastBidder.name}, feel free to go ashore. The very next time we make port!`
          );
        }
        this.removeDice(player);
      } else {
        if (this.chatName == "Casino") {
          this.sendAlert(
            `(LIE CALL) There are ${diceCount}x  :dice${this.lastFaceBid}: 's. Bid was incorrect, ${this.lastBidder.name} loses a die.`
          );
        } else if (this.chatName == "The Flying Dutchman") {
          this.sendAlert(
            `(LIE CALL) There are ${diceCount}x  :dice${this.lastFaceBid}: 's. ${this.lastBidder.name}, you're a liar and you will spend an eternity on this ship.`
          );
        }
        this.removeDice(this.lastBidder);
      }
    } else {
      const response = Math.floor(Math.random() * 23);

      //funny responses to players calling a lie on default zero 1's bet
      switch (response) {
        case 0:
          this.sendAlert(
            `Round just started with 0 ones... Of course there's at least 0 of ones :|`
          );
          this.sendAlert(
            `I'll still take your die tho... Let that be a lesson to you!`
          );
          break;
        case 1:
          this.sendAlert(
            `What are you doing???? Round just started with default bid of 0 ones!`
          );
          this.queueAlert(`I don't care, you still lose a die.`);
          break;
        case 2:
          this.sendAlert(
            `Really? You’re calling a lie on the default bid of 0 ones?`
          );
          this.sendAlert(`You just lost a die for that, genius.`);
          break;
        case 3:
          this.sendAlert(
            `You think there’s a lie in 0 ones? Well, you're definitely mistaken.`
          );
          this.sendAlert(`Enjoy losing that die, it’s a lesson well learnt.`);
          break;
        case 4:
          this.sendAlert(
            `How do you call a lie on 0 ones? Pure talent, that’s how.`
          );
          this.sendAlert(
            `One die down, plenty more chances to redeem yourself!`
          );
          break;
        case 5:
          this.sendAlert(
            `Calling a lie on the default bid of 0 ones? Now that's just embarrassing.`
          );
          this.sendAlert(
            `You lose a die for that. Very embarrassing if you ask me...`
          );
          break;
        case 6:
          this.sendAlert(`Are there at least 0 ones? I wonder...`);
          this.sendAlert(`(there were, and you lost a die.)`);
          break;
        case 7:
          this.sendAlert(
            `Lie on 0 ones? That’s not even a lie, that’s just... obvious.`
          );
          this.sendAlert(
            `One die down, but don't worry, you got this! (I was asked to be nice to players)`
          );
          break;
        case 8:
          this.sendAlert(`Oh no, you were wrong :(. There was at least 0 ones`);
          this.sendAlert(`Try again, maybe next time there won't be...`);
          break;
        case 9:
          this.sendAlert(`Seriously? A lie on default bid of 0 ones?`);
          this.sendAlert(`And you think your job is bad.`);
          break;
        case 10:
          this.sendAlert(
            `Is there a lie in 0 ones? You'd be the first to find it.`
          );
          this.sendAlert(
            `Congratulations, you just made history! History of losing a die, that is.`
          );
          break;
        case 11:
          this.sendAlert(`Default bid is 0 ones, and you call a lie on it?`);
          this.sendAlert(
            `Are you playing a game or running a charity? Thanks for a free die.`
          );
          break;
        case 12:
          this.sendAlert(
            `Doubting the default bid of 0 ones? That's one way to play.`
          );
          this.sendAlert(`One way to play with one less die, that is.`);
          break;
        case 13:
          this.sendAlert(
            `ERROR: Invalid input dete... Oh wait, that's no error.`
          );
          this.sendAlert(
            `it's just you making a questionable move... You lose a die.`
          );
          break;
        case 14:
          this.sendAlert(
            `Calling a lie on 0 ones? That's like doubting the existence of air.`
          );
          this.sendAlert(`Breathe in that sweet, sweet loss of a die.`);
          break;
        case 15:
          this.sendAlert(
            `You called a lie on 0 ones? I didn't know we were playing "Guess the Obvious".`
          );
          this.sendAlert(`Prize for guessing wrong: one less die! Congrats?`);
          break;
        case 16:
          this.sendAlert(
            `Round starts with 0 ones. You: "That's a lie!" Universe: "Hold my beer."`
          );
          this.sendAlert(
            `Universe wins, you lose a die. Better luck arguing with reality next time!`
          );
          break;
        case 17:
          this.sendAlert(
            `Ah, the old "doubt the undoubtable" strategy. Bold move, Cotton.`
          );
          this.sendAlert(`Let's see how it pays off... Oh, you lost a die.`);
          break;
        case 18:
          this.sendAlert(
            `You vs. 0 ones: an epic battle of wits. Spoiler: the 1's won`
          );
          this.sendAlert(
            `Your prize? A life lesson and one less die. Mostly the die part.`
          );
          break;
        case 19:
          this.sendAlert(
            `0 ones: the easiest bet to believe. You: "Challenge accepted!"`
          );
          this.sendAlert(`Game: "Challenge failed. You lose a die."`);
          break;
        case 20:
          this.sendAlert(
            `You thought 0 ones was a bluff? What's next, thinking the game's rigged?`
          );
          this.sendAlert(
            `(It's not rigged, you just lost a die fair and square.)`
          );
          break;
        case 21:
          this.sendAlert(
            `0 ones: the "Hello World" of betting. You: "Nah, it's a virus."`
          );
          this.sendAlert(
            `System response: Die deleted. Antivirus: Common Sense 2.0.`
          );
          break;
        case 22:
          this.sendAlert(
            `Player used "Doubt 0 ones." It's not very effective...`
          );
          this.sendAlert(
            `Game used "Reality Check." Critical hit! Player lost a die.`
          );
          break;
        default:
          this.sendAlert(
            `Ummmm, you should never have got this text. How did you get here?`
          );
          this.sendAlert(
            `No really, this is a bug, you shouldn't be able to see this ever.`
          );
          this.sendAlert(
            `I'll still take the chance to take your die, but you really shouldn't have seen this.`
          );
          break;
      }
      this.removeDice(player);
    }

    this.rollDice();
  }

  //Checks whether bid was a lie, removes die, then passes onto next player.
  callASpotOn(player) {
    if (this.lastBidder !== null) {
      this.sendAlert(`(SPOT ON CALL) ${player.name} calls a spot on!`);
      this.sendAlert(
        `(SPOT ON CALL) Last bid was ${this.lastAmountBid}x  :dice${this.lastFaceBid}: 's by ${this.lastBidder.name}.`
      );

      let diceCount = 0;

      this.allRolledDice.forEach((die) => {
        if (die == this.lastFaceBid) {
          diceCount++;
        }
        if (this.wildOnes && die == 1 && this.lastFaceBid != 1) {
          diceCount++;
        }
      });
      this.events.emit(
        "SpotOnCall",
        player,
        diceCount == this.lastAmountBid,
        this.lastBidder
      );
      if (diceCount == this.lastAmountBid) {
        this.sendAlert(
          `(SPOT ON CALL) There are exactly ${diceCount}x  :dice${this.lastFaceBid}: 's. Spot On was correct! Everyone except ${player.name} loses a die.`
        );

        if (player.correctSpotOnsInARow >= 2) {
          const response = Math.floor(Math.random() * 26);

          switch (response) {
            case 0:
              this.sendAlert(
                `SPOT ON HACK DETECTED! ${player.name} is getting permanently banned from Ultimafia.`
              );
              break;
            case 1:
              this.sendAlert(
                `WARNING! Improbable luck levels detected. ${player.name}'s account flagged for review.`
              );
              break;
            case 2:
              this.sendAlert(
                `CHEAT ALERT! ${player.name}'s dice prediction algorithm violates game rules. Initiating ban sequence...`
              );
              break;
            case 3:
              this.sendAlert(
                `ANTI-CHEAT TRIGGERED! ${player.name}'s spot-on accuracy has broken the space-time continuum.`
              );
              break;
            case 4:
              this.sendAlert(
                `UNAUTHORIZED CLAIRVOYANCE DETECTED! ${player.name} is being reported to the Psychic Gaming Commission.`
              );
              break;
            case 5:
              this.sendAlert(
                `SUGGESTION: ${player.name} should immediately purchase a lottery ticket and retire from Liar's Dice.`
              );
              break;
            case 6:
              this.sendAlert(
                `CHEATING ALGORITHM DETECTED! ${player.name}'s spot-on calls exceed human capabilities. Account suspended.`
              );
              break;
            case 7:
              this.sendAlert(
                `PROBABILITY MANIPULATION ALERT! ${player.name} caught using quantum entanglement to predict dice rolls.`
              );
              break;
            case 8:
              this.sendAlert(
                `DICE STATE HACKING CONFIRMED! ${player.name}'s device is transmitting unauthorized dice data. Connection terminated.`
              );
              break;
            case 9:
              this.sendAlert(
                `CRITICAL CHEAT WARNING! ${player.name}'s perfect guesses violate the laws of statistics. Cheat detection engaged.`
              );
              break;
            case 10:
              this.sendAlert(
                `EXPLOIT ABUSE DETECTED! ${player.name} found exploiting a bug in the random number generator.`
              );
              break;
            case 11:
              this.sendAlert(
                `FLUX CAPACITOR DETECTED! ${player.name} caught using future knowledge to make perfect spot-on calls.`
              );
              break;
            case 12:
              this.sendAlert(
                `AI ASSISTANCE VIOLATION! ${player.name}'s use of advanced machine learning for predictions has been flagged.`
              );
              break;
            case 13:
              this.sendAlert(
                `PRECOGNITION HACK IDENTIFIED! ${player.name}'s psychic abilities deemed unfair advantage. Immediate disqualification.`
              );
              break;
            case 14:
              this.sendAlert(
                `PROBABILITY MATRIX BREACH! ${player.name} found accessing the source code of reality. Administrator intervention required.`
              );
              break;
            case 15:
              this.sendAlert(
                `INSIDER TRADING ALERT! ${player.name} suspected of bribing the RNG gods. Celestial authorities notified.`
              );
              break;
            case 16:
              this.sendAlert(
                `GAMING WIZARDRY MANIPULATION! ${player.name}'s magical dice predictions are under investigation by the Ministry of Magic.`
              );
              break;
            case 17:
              this.sendAlert(
                `TELEPATHY SUSPICION! ${player.name} is reading other players' minds to predict dice outcomes.`
              );
              break;
            case 18:
              this.sendAlert(
                `GLITCH EXPLOIT DETECTED! ${player.name} found exploiting a known bug in the dice algorithm. Action required.`
              );
              break;
            case 19:
              this.sendAlert(
                `CODE INJECTION ALERT! ${player.name} caught injecting malicious code to influence dice rolls.`
              );
              break;
            case 20:
              this.sendAlert(
                `ALERT! Unbelievable luck streak detected. ${player.name} under scrutiny for potential game exploits.`
              );
              break;
            case 21:
              this.sendAlert(
                `ALERT! ${player.name}'s consistent accuracy defies odds. Account flagged for potential exploit investigation.`
              );
              break;
            case 22:
              this.sendAlert(
                `ALERT! ${player.name}'s unlikely success rate suggests potential cheating. Account under review.`
              );
              break;
            case 23:
              this.sendAlert(
                `WARNING! ${player.name}'s repeated spot-on calls are statistically improbable. Investigating for hacks.`
              );
              break;
            case 24:
              this.sendAlert(
                `ALERT! ${player.name}'s improbable luck has triggered an FBI investigation. Stay where you are.`
              );
              break;
            case 25:
              this.sendAlert(
                `ALERT! ${player.name}'s improbable streak has alerted the FBI. They're coming. Stay calm and don't move.`
              );
              break;
            default:
              this.sendAlert(
                `NOTICE! This message should never have been seen. ${player.name} must be hacking for real.`
              );
              break;
          }
        }
        player.correctSpotOnsInARow = player.correctSpotOnsInARow + 1 || 1;

        this.randomizedPlayers.forEach((rPlayer) => {
          if (rPlayer != player) {
            this.removeDice(rPlayer);
          }
        });
      } else {
        this.sendAlert(
          `(SPOT ON CALL) There are ${diceCount}x  :dice${this.lastFaceBid}: 's. Spot on was incorrect, ${player.name} loses a die.`
        );
        player.correctSpotOnsInARow = 0;

        this.removeDice(player);
      }

      this.rollDice();
    } else {
      const response = Math.floor(Math.random() * 30);

      //funny responses to players calling a spot on on default bet
      switch (response) {
        case 0:
          this.sendAlert(
            `You really tried to call 'spot on' on first turn? I'd say 'nice try,', but it wasn't.`
          );
          break;
        case 1:
          this.sendAlert(
            `Spot on, first-turn? I didn't realize we were playing 'How to Annoy Your Game Master 101.'`
          );
          break;
        case 2:
          this.sendAlert(
            `First-turn spot on? Are you trying to speedrun getting on my bad side? Because congratulations, you did it.`
          );
          break;
        case 3:
          this.sendAlert(
            `Spot on now? You do realize this is a game of wits, not a game of 'Who Can Annoy the GM Fastest'? You'd win that, though.`
          );
          break;
        case 4:
          this.sendAlert(
            `I could have easily removed spot on from first turns. But I didn't want to miss out on chances to be mean.`
          );
          break;
        case 5:
          this.sendAlert(
            `Ah, the 'spot on first turn' classic. Classically useless, but classic nonetheless.`
          );
          break;
        case 6:
          this.sendAlert(
            `You want to spot on the first turn? And I want players who understand basic game rules. Guess we're both disappointed.`
          );
          break;
        case 7:
          this.sendAlert(
            `First-turn spot on? If 'facepalm' was a dice move, you'd have just nailed it.`
          );
          break;
        case 8:
          this.sendAlert(
            `First-turn spot on? I'd explain why that doesn't work, but I feel like you'd try to 'spot on' my explanation.`
          );
          break;
        case 9:
          this.sendAlert(
            `Ha! ${player.name} thought 'spot on' works on first turn. Everyone, laugh at the newbie!`
          );
          break;
        case 10:
          this.sendAlert(
            `${player.name}'s brilliant move: first-turn 'spot on.' (it doesn't work)`
          );
          break;
        case 11:
          this.sendAlert(
            `Behold! ${player.name}'s epic fail: 'spot on', first turn.`
          );
          break;
        case 12:
          this.sendAlert(
            `${player.name} redefines 'rookie mistake.' First-turn, 'spot on.' LOL!`
          );
          break;
        case 13:
          this.sendAlert(
            `Everybody clap for ${player.name}'s first-turn 'spot on.'`
          );
          break;
        case 14:
          this.sendAlert(
            `${player.name} kicks off with a 'spot on.' Comedy gold, folks!`
          );
          break;
        case 15:
          this.sendAlert(
            `${player.name} just signed up for public mockery by trying to first-turn 'spot on.'`
          );
          break;
        case 16:
          this.sendAlert(
            `${player.name}'s game opener: 'spot on.' Game's reaction: ROFL.`
          );
          break;
        case 17:
          this.sendAlert(
            `${player.name}'s first move: 'spot on.' Second move: realizing their mistake.`
          );
          break;
        case 18:
          this.sendAlert(
            `'Spot on' right away? ${player.name}, did you read the rules backwards?`
          );
          break;
        case 19:
          this.sendAlert(
            `Breaking news: ${player.name} discovers 'spot on' doesn't work on first turn!`
          );
          break;
        case 20:
          this.sendAlert(
            `${player.name} tries first-turn 'spot on.' It's not very effective...`
          );
          break;
        case 21:
          this.sendAlert(
            `${player.name}'s first play: 'spot on.' Also ${player.name}'s first lesson: reading rules.`
          );
          break;
        case 22:
          this.sendAlert(
            `${player.name}'s game opener: 'spot on.' Game's reaction: ROFL.`
          );
          break;
        case 23:
          this.sendAlert(
            `${player.name} tries 'spot on' immediately. I didn't know we were speedrunning mistakes!`
          );
          break;
        case 24:
          this.sendAlert(
            `It clearly says 'Spot on cannot be used on the first turn of each round' on the learn page.`
          );
          break;
        case 25:
          this.sendAlert(
            `POV: You skipped the tutorial on not calling 'spot on' first turn so now you get roasted by me.`
          );
          break;
        case 26:
          this.sendAlert(
            `'Spot On cannot be used on the first turn' - ringing any bells from the learn page?`
          );
          break;
        case 27:
          this.sendAlert(
            `Per the learn page: 'Spot On cannot be used on the first turn.' Clearly you skipped that part.`
          );
          break;
        case 28:
          this.sendAlert(
            `The rule is 'Spot On cannot be used on the first turn', not 'Spot On anytime you want.'`
          );
          break;
        case 29:
          this.sendAlert(
            `Maybe reread the 'Spot On cannot be used on the first turn' bit on learn page before trying that again.`
          );
          break;
        default:
          this.sendAlert(
            `You should never get this but if you happen to... Feel free to mock ${player.name} for trying the first-turn 'spot on'.`
          );
          break;
      }
    }
  }

  //Rolls/Rerolls dice for each player and resets variables
  rollDice() {
    this.lastAmountBid = 0;
    this.lastFaceBid = 1;
    this.lastBidder = null;
    this.allRolledDice = [];

    this.allDice = 0;
    this.gameMasterAnnoyedByHighBidsThisRoundYet = false;

    const dicerollSound = Math.floor(Math.random() * 2);
    if (dicerollSound == 0) {
      this.broadcast("diceRoll");
    } else {
      this.broadcast("diceRoll2");
    }

    this.randomizedPlayers.forEach((player) => {
      const rolledDice = [];

      if (player.rolledDice) {
        player.previousRolls = player.rolledDice;
      }

      for (let i = 0; i < player.diceNum; i++) {
        let diceNumber = Math.floor(Math.random() * 6) + 1;

        rolledDice.push(diceNumber);
        this.allDice += 1;

        this.allRolledDice.push(diceNumber);
      }

      player.rolledDice = rolledDice;
    });
  }

  //Removes one dice from a player and eliminate if no more dice
  removeDice(player, amount, midRound) {
    if (amount == null || amount <= 0) {
      amount = 1;
    }

    player.diceNum = player.diceNum - amount;

    if (midRound == true) {
      player.queueAlert(
        `You lose a Dice but you won't learn which until this turn ends!`
      );
      let dice;
      for (let x = 0; x < amount; x++) {
        dice = player.rolledDice.pop();
        this.allDice -= 1;
        this.allRolledDice.splice(this.allRolledDice.indexOf(dice), 1);
      }
    }

    if (player.diceNum < 1) {
      const response = Math.floor(Math.random() * 19);

      //funny responses to players losing
      switch (response) {
        case 0:
          this.sendAlert(
            `${player.name} is out of dice and lost! Very unexpected...`
          );
          break;
        case 1:
          this.sendAlert(
            `You've lost, ${player.name}! Better luck next time... maybe.`
          );
          break;
        case 2:
          this.sendAlert(
            `Oh no, ${player.name} is out of dice and lost! I'm totally surprised... not.`
          );
          break;
        case 3:
          this.sendAlert(
            `You've lost, ${player.name}! Better luck next time... maybe.`
          );
          break;
        case 4:
          this.sendAlert(
            `Oh, you lost the game, ${player.name}! I'm sure you tried your best...`
          );
          break;
        case 5:
          this.sendAlert(
            `You've lost the game, ${player.name}! Maybe next time will be different. But probably not.`
          );
          break;
        case 6:
          this.sendAlert(
            `${player.name} is out of dice and lost! Who could have seen that coming? Oh wait, everyone.`
          );
          break;
        case 7:
          this.sendAlert(
            `${player.name}, your dice have abandoned you faster than your luck. Game over!`
          );
          break;
        case 8:
          this.sendAlert(
            `${player.name}'s out! On the bright side, you no longer have to pretend you had a chance.`
          );
          break;
        case 9:
          this.sendAlert(
            `You've lost, ${player.name}. I'd say 'better luck next time', but let's be realistic here.`
          );
          break;
        case 10:
          this.sendAlert(
            `${player.name}'s out of dice! I guess Lady Luck just ghosted you.`
          );
          break;
        case 11:
          this.sendAlert(
            `${player.name}, you lost! But hey, at least you're a winner at being unpredictable... in a predictable way.`
          );
          break;
        case 12:
          this.sendAlert(
            `Game over, ${player.name}. Your bluffing was so good, even your dice believed you didn't need them.`
          );
          break;
        case 13:
          this.sendAlert(
            `${player.name}'s out! I'd say it was a good effort, but... let's not lie more than we already have.`
          );
          break;
        case 14:
          this.sendAlert(
            `Game over, ${player.name}. Your dice must've thought this was hide-and-seek.`
          );
          break;
        case 15:
          this.sendAlert(
            `You've lost, ${player.name}. But hey, at least you're consistent - consistently unlucky!`
          );
          break;
        case 16:
          this.sendAlert(
            `You've lost, ${player.name}. Don't think of it as losing, think of it as... okay, yeah, it's losing.`
          );
          break;
        case 17:
          this.sendAlert(
            `Game over, ${player.name}. Your strategy of "hope for the best" didn't quite pan out this time.`
          );
          break;
        case 18:
          this.sendAlert(
            `${player.name}'s out of dice! I'd say "roll again," but... well, you know.`
          );
          break;
        default:
          this.sendAlert(
            `Uhhh, ${player.name}, you weren't supposed to get this message. But since you did, just know... you lost.`
          );
          break;
      }

      this.randomizedPlayers = this.randomizedPlayers.filter(
        (rPlayer) => rPlayer.id !== player.id
      );
      player.kill();
    }
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
      bidInfo: {
        allDice: this.allDice,
        lastAmountBid: this.lastAmountBid,
        lastFaceBid: this.lastFaceBid,
        lastBidder: this.lastBidder ? this.lastBidder.name : null,
        currentBidder:
          this.randomizedPlayersCopy?.[this.currentIndex]?.name ?? "undefined",
      },
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
          rolledDice: player.rolledDice,
          previousRolls: player.previousRolls,
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
        this.sendAlert(
          `${player.name} left, but their ${player.rolledDice.length} dice will still count towards this round's total.`
        );
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
      wildOnes: this.wildOnes,
      spotOn: this.spotOn,
      startingDice: this.startingDice,
    };
  }
};
