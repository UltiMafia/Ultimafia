const Card = require("../../Card");

module.exports = class GuessAdversaryKill extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Adversary": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          labels: ["kill"],
          run: function () {
            if (this.role.roleToGuess == null) return;
            for (let x = 0; x < this.role.roleToGuess.length; x++) {
              if (this.target.getRoleName() == this.role.roleToGuess[x]) {
                if (this.dominates()) this.target.kill("basic", this.actor);
              }
            }

            //if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};
