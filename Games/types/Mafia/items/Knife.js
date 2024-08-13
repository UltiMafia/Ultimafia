const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class Knife extends Item {
  constructor(options) {
    super("Knife");

    this.reveal = options?.reveal;
    this.broken = options?.broken;
    this.magicCult = options?.magicCult;

    this.meetings = {
      "Stab Knife": {
        actionName: "Stab",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["stab"],
          item: this,
          run: function () {
            var reveal = this.item.reveal;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }

            var broken = this.item.broken;
            var magicCult = this.item.magicCult;
            if (broken) {
              this.target = this.actor;
            }

            if (reveal && broken)
              this.game.queueAlert(
                `:knife: ${this.actor.name} nicks themself with a knife!`
              );
            else if (reveal && !broken)
              this.game.queueAlert(
                `:knife: ${this.actor.name} stabs ${this.target.name} with a knife!`
              );
            else
              this.game.queueAlert(
                `:knife: Someone stabs ${this.target.name} with a knife!`
              );

            if (this.dominates()) {
              if (magicCult) {
                this.target.giveEffect("BleedingCult", this.actor);
              } else {
                this.target.giveEffect("Bleeding", this.actor);
              }
            }
            this.item.drop();
          },
        },
      },
    };
  }
};
