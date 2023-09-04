const Card = require("../../Card");

module.exports = class GuessAdversaryConvert extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Adversary": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["Convert"],
          run: function () {
            if (this.target.role.name != this.actor.role.rolesToGuess) {
              this.cancel();
              return; 
            }

            if (this.dominates()) this.target.setRole("Cultist");
          },
        },
      },
    };
  }
};
