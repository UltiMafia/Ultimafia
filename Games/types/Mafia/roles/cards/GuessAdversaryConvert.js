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
            /*
            if (this.actor.role.roleToGuess.isArray) {
              if (roleToGuess.indexOf(this.target.role.name) < 0) {
                this.cancel();
                return;
              }
            } else if (this.target.role.name != this.actor.role.roleToGuess) {
              this.cancel();
              return;
            }
            */
            if (this.actor.role.roleToGuess == null) return;
            for (let x = 0; x < this.actor.role.roleToGuess.length; x++) {
              if (this.target.role.name == this.actor.role.roleToGuess[x]) {
                if (this.dominates())
                  this.target.setRole("Cultist", this.actor);
              }
            }

            //if (this.dominates()) this.target.setRole("Cultist", this.actor);
          },
        },
      },
    };
  }
};
