const Card = require("../../Card");

module.exports = class Sting extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Fatally Sting": {
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["kill", "sting"],
          run: function () {
            this.game.queueAlert(
              `:sy8d: ${this.actor.name} rushes at ${this.target.name} and delivers a fatal sting!`
            );

            this.actor.kill("basic", this.actor, true);

            if (this.dominates()) this.target.kill("basic", this.target, true);
          },
        },
      },
    };
  }
};
