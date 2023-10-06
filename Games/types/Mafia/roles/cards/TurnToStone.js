const Card = require("../../Card");

module.exports = class TurnToStone extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Reveal Visage": {
        actionName: "Reveal Visage",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.stoned;
        },
        action: {
          labels: ["kill", "curse"],
          power: 2,
          run: function () {
            if (this.target === "No") return;

            if (this.actor.role.data.visitors) {
              this.actor.role.stoned = true;
              this.game.sendAlert(":ghost2: You feel a horrible presence!");
              for (let player of new Set(this.actor.role.data.visitors)) {
                if (this.dominates(player))
                  player.kill("curse", this.actor, true);
              }
            }
          },
        },
      },
    };
  }
};
