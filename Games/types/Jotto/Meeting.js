const Meeting = require("../../core/Meeting");
const unique4 = require("./data/unique-letters-4");
const unique5 = require("./data/unique-letters-5");

// set word list based on game settings
const wordList = {
  4: {
    // duplicate 4
    true: unique4,
    // unique 4
    false: unique4,
  },
  5: {
    // duplicate 5
    true: unique5,
    // unique 5
    false: unique5,
  }
}

module.exports = class JottoMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);

    this.wordList = new Set(wordList[this.game.wordLength][this.game.duplicateLetters]);
    const extraText = this.game.duplicateLetters ? "" : "with unique letters";
    this.alertMsg = `Please enter a dictionary word ${extraText}.`;
  }

  vote(voter, selection) {
    if (!this.wordList.has(selection)) {
      voter.sendAlert(this.alertMsg);

      voter.send("unvote", {
        voterId: voter.id,
        meetingId: this.id,
        target: selection,
      });
  
      return;
    }

    super.vote(voter, selection);
  }
};
