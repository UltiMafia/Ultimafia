const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class Vanillaise extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Vanillaise": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            var vanilla;
            if (this.target.alignment === "Village" || this.target.winCount === "Village") {
              vanilla = "Villager";
            } else if (this.target.alignment === "Mafia") {
              vanilla = "Mafioso";
            } else if (this.target.alignment === "Cult") {
              vanilla = "Cultist";
            } else if (this.target.alignment === "Independent") {
              vanilla = "Grouch";
            }
            if (this.dominates()) {
              this.target.setRole(vanilla);
              this.actor.queueAlert(
                `You have converted ${this.target.name} to a ${vanilla}!`
              );
            } else {
              this.actor.queueAlert(
                `You have failed to convert ${this.target.name}!`
              );
            }
          },
        },
      },
    };
  }
};
