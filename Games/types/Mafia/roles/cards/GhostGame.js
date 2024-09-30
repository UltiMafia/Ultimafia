const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const wordList = require("../../../../../data/words");

module.exports = class GhostGame extends Card {
  constructor(role) {
    super(role);

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
    };
    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        const numGhostAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Ghost"
        ).length;
        if (
          (aliveCount > 0 && numGhostAlive >= aliveCount / 2) ||
          this.guessedWord === this.game.townWord
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
