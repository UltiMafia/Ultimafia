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
          role: this.role,
          labels: ["kill", "curse"],
          power: 2,
          run: function () {
            if (this.target === "No") return;

            if (this.role.data.visitors) {
              this.role.stoned = true;
              if (!this.actor.hasAbility(["Kill"])) {
                return;
              }
              this.game.sendAlert(":ghost2: You feel a horrible presence!");
              for (let player of new Set(this.role.data.visitors)) {
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
