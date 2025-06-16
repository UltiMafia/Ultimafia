const Meeting = require("./Meeting");

module.exports = class PostgameMeeting extends Meeting {
  constructor(game) {
    super(game, "Postgame");

    this.group = true;
    this.speech = true;
    this.speakDead = true;
    this.noVeg = true;
    this.displayVoteCounter = true;
    this.noOneDisplayName = "No One Deserves A Kudos";

    if (game.isKudosEligible()) {
      this.voting = true;
      this.randomizeTieResults = true;
      this.actionName = "Vote to give kudos";
      this.targets = { include: ["members"], exclude: ["self"] };
    }
  }
};
