const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
module.exports = class GuessAdversaryConvert extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Adversary": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          labels: ["Convert"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            if (this.role.roleToGuess == null) return;
            for (let x = 0; x < this.role.roleToGuess.length; x++) {
              if (this.target.getRoleName() == this.role.roleToGuess[x]) {
                if (this.dominates())
                  this.target.setRole("Cultist", this.actor);
              }
            }
          },
        },
      },
    };
  }
};
