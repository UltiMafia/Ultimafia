const Card = require("../../Card");

module.exports = class GuessWinningTeam extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Winning Team": {
        states: ["Gambler Guess"],
        flags: ["voting", "mustAct"],
        inputType: "alignment",
        targets: ["Blue", "Red"],
        action: {
          run: function () {
            this.actor.role.data.guess = this.target;
          },
        },
      },
    };
    this.stateMods = {
      "Gambler Guess": {
        type: "add",
        index: 4,
        length: 1000 * 30,
        shouldSkip: function () {
          return this.game.round != this.game.roundAmt;
        },
      },
    };
    this.winCheck = {
      priority: 1,
      check: function (winners) {
        if (winners.groups[this.data.guess])
          winners.addPlayer(this.player, "Gambler");
      },
    };
  }
};
