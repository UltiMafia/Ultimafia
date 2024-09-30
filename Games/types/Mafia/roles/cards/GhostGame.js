const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const wordList = require("../../../../../data/words");

module.exports = class GhostGame extends Card {
  constructor(role) {
    super(role);
      let wordPack = Random.randArrayVal(wordList);
      let shuffledWordPack = Random.randomizeArray(wordPack);
      this.realWord = shuffledWordPack[0];
      this.fakeWord = shuffledWordPack[1];
      this.wordLength = this.realWord.length;
  }
};
