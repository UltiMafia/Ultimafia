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
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["stab"],
          item: this,
          run() {
            let { reveal } = this.item;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }

            const { cursed } = this.item;
            if (cursed) {
              this.target = this.actor;
            }

            if (reveal && cursed)
              this.game.queueAlert(
                `${this.actor.name} nicks themself with a poisoned knife!`
              );
            else if (reveal && !cursed)
              this.game.queueAlert(
                `:sy3h: ${this.actor.name} stabs ${this.target.name} with a poisoned knife!`
              );
            else
              this.game.queueAlert(
                `:sy3h: Someone stabs ${this.target.name} with a poisoned knife!`
              );

            this.target.giveEffect("Poison", this.actor);
            this.item.drop();
          },
        },
      },
    };
  }
};
