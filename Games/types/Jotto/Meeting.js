const Meeting = require("../../core/Meeting");
const wordList = require("./data/wordList");

module.exports = class JottoMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);

    this.wordList =
      wordList[this.game.wordLength][this.game.duplicateLetters].set;
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
