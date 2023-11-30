const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class EasterEggDrunkDrive extends Card {
  constructor(role) {
    super(role);

      this.actions = [
        {
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["hidden"],
          run: function () {
            if (
              this.actor.role.name === "Drunk" &&
              (this.target.role.name === "Driver" ||
                this.target.role.name === "Chauffeur")
            ) {
              let action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                labels: ["kill"],
                power: 2,
                run: function () {
                  if (this.dominates())
                    this.target.kill("drunkDrive", this.actor);
                },
              });
              action.do();
            }
          },
        },
      ];
  }
};
