const Item = require("../Item");
const Random = require("../../../../lib/Random");
const Action = require("../Action");

module.exports = class Whiskey extends Item {
  constructor(options) {
    super("Whiskey");

    this.reveal = options?.reveal;
    this.cursed = options?.cursed;

    this.meetings = {
      "Share Whiskey": {
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["sedate"],
          item: this,
          run: function () {
            var reveal = this.item.reveal;
            if (reveal == null) reveal = Random.randArrayVal([true, false]);

            var cursed = this.item.cursed;
            if (cursed) {
              this.target = this.actor;
            }

            if (reveal && cursed) {
              this.actor.queueAlert(
                `:beer: You couldn't resist drinking all that whiskey yourself…`
              );
            } else {
              this.actor.queueAlert(
                `:beer: You share your whiskey with ${this.target.name}!`
              );

              const actorNameToShow = reveal ? this.actor.name : ":Someone";
              this.target.queueAlert(
                `:beer: ${actorNameToShow} shares their whiskey with you!`
              );
            }

            if (this.dominates()) this.target.giveEffect("Sedate", this.actor);

            if (
              this.target.role.name === "Driver" ||
              this.target.role.name === "Chauffeur"
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

            this.item.drop();
          },
        },
      },
    };
  }
};
