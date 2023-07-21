const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class Knife extends Item {
  constructor(options) {
    super("Knife");

    this.reveal = options?.reveal;
    this.cursed = options?.cursed;

    this.meetings = {
      "Stab Knife": {
        actionName: "Stab",
        states: ["Day", "Night"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["stab"],
          item: this,
          run: function () {
            var reveal = this.item.reveal;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }

            var cursed = this.item.cursed;
            if (cursed) {
              this.target = this.actor;
            }

            if (reveal && cursed)
              this.game.queueAlert(
                `${this.actor.name} nicks themself with a knife!`
              );
            else if (reveal && !cursed)
              this.game.queueAlert(
                `:sy3h: ${this.actor.name} stabs ${this.target.name} with a knife!`
              );
            else
              this.game.queueAlert(
                `:sy3h: Someone stabs ${this.target.name} with a knife!`
              );

            if (this.dominates()) {
              this.target.giveEffect("Bleeding", this.actor);
            }
            this.item.drop();
          },
        },
      },
    };
  }
};
