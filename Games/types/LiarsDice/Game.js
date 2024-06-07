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


    //needed variables
    this.randomizedPlayers = [];
    this.currentIndex = 0;

    this.lastAmountBid = 0;
    this.lastFaceBid = 1;
    this.lastBidder = 0;
  }

  start() {
    this.randomizedPlayers = Random.randomizeArray(this.players.array());
    
    this.randomizedPlayers.forEach(player => {
      player.diceNum = 5;
    });

    this.rollDice();
    this.startRoundRobin();

    if (this.wildOnes) {
      this.queueAlert(`Wild Ones is enabled. Ones will count towards any face amount.`);
    }
    this.queueAlert(`Player order: ${this.randomizedPlayers.map(player => player.name)}`);
    this.queueAlert(`Good luck... You'll probably need it.`);

    super.start();
  }

  //Start: Randomizes player order, and gives the microphone to first one.
  startRoundRobin() {
    while (true) {
      let nextPlayer = this.randomizedPlayers[this.currentIndex];
      if (nextPlayer.alive) {
        nextPlayer.holdItem("Microphone");
        return;
      }
    }
  }

  //Called each round, cycles between players.
  incrementCurrentIndex() {
    this.currentIndex = (this.currentIndex + 1) % this.randomizedPlayers.length;
  }

  //After someone uses microphone, it passes it to the next player.
  incrementState() {
    let previousState = this.getStateName();

    if (previousState == "Guess Dice") {
      this.incrementCurrentIndex();
      while (true) {
        let nextPlayer = this.randomizedPlayers[this.currentIndex];
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
    if (this.lastBidder !== null) {
      this.queueAlert(`Last bid was ${this.lastAmountBid}x ${this.lastFaceBid}'s by ${this.lastBidder.name}.`);

      let diceCount = 0;

      this.randomizedPlayers.forEach(player => {
        for (let i = 0; i < player.diceNum; i++) {
          if (player.rolledDice[i] == this.lastFaceBid) {
            diceCount++;
          }
          if (this.wildOnes && player.rolledDice[i] == 1 && this.lastFaceBid !== 1) {
            diceCount++;
          }
        }
      });

      if (diceCount >= this.lastAmountBid) {
        this.queueAlert(`There are ${diceCount}x ${this.lastFaceBid}'s. Bid was correct, ${player.name} loses a dice.`);
        this.removeDice(player);
      } else {
        this.queueAlert(`There are ${diceCount}x ${this.lastFaceBid}'s. Bid was incorrect, ${this.lastBidder.name} loses a dice.`);
        this.removeDice(this.lastBidder);
      }
      
    } else {
      const response = Math.floor(Math.random() * 24);
      
      //funny responses to players calling a lie on default zero 1's bet
      switch (response) {
        case 0:
          this.queueAlert(`Round just started with 0x 1's... Of course there's at least 0 of ones :|`);
          this.queueAlert(`I'll still take your dice tho... Let that be a lesson to you!`);
          break;
        case 1:
          this.queueAlert(`What are you doing???? Round just started with default 0x 1's!`);
          this.queueAlert(`I don't care, you still lose dice.`);
          break;
        case 2:
          this.queueAlert(`Really? You’re calling a lie on the default 0x 1's?`);
          this.queueAlert(`You just lost a dice for that, genius.`);
          break;
        case 3:
          this.queueAlert(`You think there’s a lie in 0x 1's? Well, you're definitely mistaken.`);
          this.queueAlert(`Enjoy losing that dice, it’s a lesson well learnt.`);
          break;
        case 4:
          this.queueAlert(`How do you call a lie on 0x 1's? Pure talent, that’s how.`);
          this.queueAlert(`One dice down, plenty more chances to redeem yourself!`);
          break;
        case 5:
          this.queueAlert(`Calling a lie on the default 0x 1's? Now that's just embarrassing.`);
          this.queueAlert(`You lose a dice for that. Very embarrassing if you ask me...`);
          break;
        case 6:
          this.queueAlert(`Are there at least 0x 1's? I wonder...`);
          this.queueAlert(`(there were, and you lost a dice.)`);
          break;
        case 7:
          this.queueAlert(`Lie on 0x 1's? That’s not even a lie, that’s just... obvious.`);
          this.queueAlert(`One dice down, but don't worry, you got this! (I was asked to be nice to players)`);
          break;
        case 8:
          this.queueAlert(`Oh no, you were wrong :(. There was at least 0x 1's`);
          this.queueAlert(`Try again, maybe next time there won't be...`);
          break;
        case 9:
          this.queueAlert(`Seriously? A lie on default 0x 1's?`);
          this.queueAlert(`And you think your job is bad.`);
          break;
        case 10:
          this.queueAlert(`Is there a lie in 0x 1's? You'd be the first to find it.`);
          this.queueAlert(`Congratulations, you just made history! History of losing a dice, that is.`);
          break;
        case 11:
          this.queueAlert(`Default bet is 0x 1's, and you call a lie?`);
          this.queueAlert(`Are you playing a game or running a charity? Thanks for a free dice.`);
          break;
        case 12:
          this.queueAlert(`Doubting the default 0x 1's? That's one way to play.`);
          this.queueAlert(`One way to play with one less dice, that is.`);
          break;
        case 13:
          this.queueAlert(`ERROR: Invalid input dete... Oh wait, that's no error.`);
          this.queueAlert(`it's just you making a questionable move... You lose a dice.`);
          break;
        case 14:
          this.queueAlert(`Calling a lie on 0x 1's? That's like doubting the existence of air.`);
          this.queueAlert(`Breathe in that sweet, sweet loss of a dice.`);
          break;
        case 15:
          this.queueAlert(`You called a lie on 0x 1's? I didn't know we were playing "Guess the Obvious".`);
          this.queueAlert(`Prize for guessing wrong: one less dice! Congrats?`);
          break;
        case 16:
          this.queueAlert(`Round starts with 0x 1's. You: "That's a lie!" Universe: "Hold my beer."`);
          this.queueAlert(`Universe wins, you lose a dice. Better luck arguing with reality next time!`);
          break;
        case 17:
          this.queueAlert(`Ah, the old "doubt the undoubtable" strategy. Bold move, Cotton.`);
          this.queueAlert(`Let's see how it pays off... Oh, you lost a dice.`);
          break;
        case 18:
          this.queueAlert(`You vs. 0x 1's: an epic battle of wits. Spoiler: the 1's won`);
          this.queueAlert(`Your prize? A life lesson and one less dice. Mostly the die part.`);
          break;
        case 19:
          this.queueAlert(`0x 1's: the easiest bet to believe. You: "Challenge accepted!"`);
          this.queueAlert(`Game: "Challenge failed. You lose a dice."`);
          break;
        case 20:
          this.queueAlert(`You thought 0x 1's was a bluff? What's next, thinking the game's rigged?`);
          this.queueAlert(`(It's not rigged, you just lost a dice fair and square. Or round, I guess.)`);
          break;
        case 21:
          this.queueAlert(`0x 1's: the "Hello World" of betting. You: "Nah, it's a virus."`);
          this.queueAlert(`System response: Dice deleted. Antivirus: Common Sense 2.0.`);
          break;
        case 22:
          this.queueAlert(`Player used "Doubt 0x 1's." It's not very effective...`);
          this.queueAlert(`Game used "Reality Check." Critical hit! Player lost a dice.`);
          break;
        case 23:
          this.queueAlert(`You vs. 0x 1's: an epic battle of wits. Spoiler: the 1's won`);
          this.queueAlert(`Your prize? A life lesson and one less die. Mostly the die part.`);
          break;
        default:
          this.queueAlert(`Ummmm, you should never have got this text. How did you get here?`);
          this.queueAlert(`No really, this is a bug, you shouldn't be able to see this ever.`);
          this.queueAlert(`I'll still take the chance to take your dice, but you really shouldn't have seen this.`);
          break;
      }
      this.removeDice(player);
    }

    this.rollDice();
  }

  //Rolls/Rerolls dice for each player and resets variables
  rollDice() {
    this.lastAmountBid = 0;
    this.lastFaceBid = 1;
    this.lastBidder = null;

    this.randomizedPlayers.forEach(player => {
      const rolledDice = [];

      for (let i = 0; i < player.diceNum; i++) {
        rolledDice.push(Math.floor(Math.random() * 6) + 1);
      }

      player.rolledDice = rolledDice;
      
      console.log(player.rolledDice);

    });
  }

  //Removes one dice from a player and eliminate if no more dice
  removeDice(player) {
    player.diceNum = player.diceNum-1;

    if (player.diceNum < 1) {

      const response = Math.floor(Math.random() * 19);
      
      //funny responses to players losing
      switch (response) {
        case 0:
          this.queueAlert(`${player.name} is out of dice and lost! Very unexpected...`);
          break;
        case 1:
          this.queueAlert(`You've lost, ${player.name}! Better luck next time... maybe.`);
          break;
        case 2:
          this.queueAlert(`Oh no, ${player.name} is out of dice and lost! I'm totally surprised... not.`);
          break;
        case 3:
          this.queueAlert(`You've lost, ${player.name}! Better luck next time... maybe.`);
          break;
        case 4:
          this.queueAlert(`Oh, you lost the game, ${player.name}! I'm sure you tried your best...`);
          break;
        case 5:
          this.queueAlert(`You've lost the game, ${player.name}! Maybe next time will be different. But probably not.`);
          break;
        case 6:
          this.queueAlert(`${player.name} is out of dice and lost! Who could have seen that coming? Oh wait, everyone.`);
          break;
        case 7:
          this.queueAlert(`${player.name}, your dice have abandoned you faster than your luck. Game over!`);
          break;
        case 8:
          this.queueAlert(`${player.name}'s out! On the bright side, you no longer have to pretend you had a chance.`);
          break;
        case 9:
          this.queueAlert(`You've lost, ${player.name}. I'd say 'better luck next time', but let's be realistic here.`);
          break;
        case 10:
          this.queueAlert(`${player.name}'s out of dice! I guess Lady Luck just ghosted you.`);
          break;
        case 11:
          this.queueAlert(`${player.name}, you lost! But hey, at least you're a winner at being unpredictable... in a predictable way.`);
          break;
        case 12:
          this.queueAlert(`Game over, ${player.name}. Your bluffing was so good, even your dice believed you didn't need them.`);
          break;
        case 13:
          this.queueAlert(`${player.name}'s out! I'd say it was a good effort, but... let's not lie more than we already have.`);
          break;
        case 14:
          this.queueAlert(`Game over, ${player.name}. Your dice must've thought this was hide-and-seek.`);
          break;
        case 15:
          this.queueAlert(`You've lost, ${player.name}. But hey, at least you're consistent - consistently unlucky!`);
          break;
        case 16:
          this.queueAlert(`You've lost, ${player.name}. Don't think of it as losing, think of it as... okay, yeah, it's losing.`);
          break;
        case 17:
          this.queueAlert(`Game over, ${player.name}. Your strategy of "hope for the best" didn't quite pan out this time.`);
          break;
        case 18:
          this.queueAlert(`${player.name}'s out of dice! I'd say "roll again," but... well, you know.`);
          break;
        default:
          this.queueAlert(`Uhhh, ${player.name}, you weren't supposed to get this message. But since you did, just know... you lost.`);
          break;
      }


      player.kill();
    }
  }


  /*UPDATING THE DICE STATE
  updateGameState() {
    this.randomizedPlayers.forEach((player) => {
      player.rolledDice = player.rolledDice || [];
    });
  
    this.emit("gameState", {
      players: this.players.map((player) => ({
        id: player.id,
        name: player.name,
        rolledDice: player.rolledDice,
      })),
    });
  }*/

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
