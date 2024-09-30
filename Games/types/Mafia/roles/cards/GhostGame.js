const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const wordList = require("../../../../../data/words");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class GhostGame extends Card {
  constructor(role) {
    super(role);

    this.immunity["condemn"] = 1;

    // Select a real word and a fake word
    let wordPack = Random.randArrayVal(wordList);
    let shuffledWordPack = Random.randomizeArray(wordPack);
    this.realWord = shuffledWordPack[0];
    this.fakeWord = shuffledWordPack[1];
    this.wordLength = this.realWord.length;

    const gameInstance = this;

    this.listeners = {
      startGame: function () {
        gameInstance.assignWordsToPlayers();
      },

      immune: function (action) {
        if (action.target == this.player) {
          this.guessOnNext = true;
        }
      },
    };

    this.meetings = {
      "Guess Word": {
        states: ["Dusk"],
        flags: ["instant", "voting"],
        inputType: "text",
        textOptions: {
          minLength: 2,
          maxLength: 20,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Confirm",
        },
        action: {
          run: function () {
            let word = this.target.toLowerCase();
            this.game.queueAlert(`${this.actor.name} guesses ${word}.`);

            this.actor.role.guessedWord = word;
            if (word !== this.game.realWord) {
              this.actor.kill();
            }

            this.actor.role.guessOnNext = false;
          },
        },
        shouldMeet: function () {
          return this.guessOnNext;
        },
      },
    };

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        const numGhostAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Ghost"
        ).length;
        if (
          (aliveCount > 0 && numGhostAlive >= aliveCount / 2) ||
          this.guessedWord === this.game.realWord
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }

  assignWordsToPlayers() {
    let villagePlayers = this.game.players.filter(
      (p) => p.role.alignment === "Village"
    );
    let mafiaOrCultPlayers = this.game.players.filter(
      (p) => p.role.alignment === "Mafia" || p.role.alignment === "Cult"
    );

    for (let villagePlayer of villagePlayers) {
      villagePlayer.role.data.assignedWord = this.realWord;
      villagePlayer.queueAlert(`The secret word is: ${this.realWord}.`);
    }

    for (let mafiaOrCultPlayer of mafiaOrCultPlayers) {
      mafiaOrCultPlayer.role.data.assignedWord = this.fakeWord;
      mafiaOrCultPlayer.queueAlert(`The secret word is: ${this.fakeWord}.`);
    }
  }
};
