const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class Snowball extends Item {
  constructor(options) {
    super("Snowball");

    this.reveal = options?.reveal;
    this.cursed = options?.cursed;

    this.meetings = {
      "Throw Snowball": {
        actionName: "Throw",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["throw"],
          item: this,
          run: function () {
            var reveal = this.item.reveal;
            if (reveal == null) reveal = Random.randArrayVal([true, false]);

            var cursed = this.item.cursed;
            if (cursed) {
              this.target = this.actor;
            }

            if (reveal && cursed)
              this.game.queueAlert(
                `${this.actor.name} pulls out a snowball, it explodes in their hand!`
              );
            else if (reveal && !cursed)
              this.game.queueAlert(
                `:sy8b: ${this.actor.name} pulls out a snowball, it hits ${this.target.name} in the face!`
              );
            else
              this.game.queueAlert(
                `:sy8b: Someone throws a snowball at ${this.target.name}!`
              );

            if (this.dominates()) this.target.giveEffect("Stun", this.actor);

            this.item.drop();
          },
        },
      },
    };
  }
};
