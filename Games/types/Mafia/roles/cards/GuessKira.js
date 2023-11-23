const Card = require("../../Card");

module.exports = class WinByGuessingKira extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Kira": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        action: {
          labels: ["kill"],
          run: function () {
            if (this.target.hasItem("Notebook")) {
                this.guessedKira += 1;
            }
          },
        },
      },
    };
  }
};
