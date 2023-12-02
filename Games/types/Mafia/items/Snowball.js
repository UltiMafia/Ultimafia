const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class Snowball extends Item {
  constructor(options) {
    super("Snowball");

    this.reveal = options?.reveal;

    this.meetings = {
      "Throw Snowball": {
        actionName: "Throw",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["throw"],
          item: this,
          run: function () {
            let reveal = this.item.reveal;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }

            if (reveal) {
              this.game.queueAlert(
                `:snowball: ${this.actor.name} pulls out a snowball, it hits ${this.target.name} in the face!`
              );
            } else {
              this.game.queueAlert(
                `:snowball: Someone throws a snowball at ${this.target.name}!`
              );
            }

            if (this.dominates()) {
              this.target.giveEffect("Frozen", this.actor);
              this.target.queueAlert(
                `:snowman: You are frozen and cannot move!`
              );
            }

            this.item.drop();
          },
        },
      },
    };
  }
};
