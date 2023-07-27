const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class Sedative extends Item {
  constructor(options) {
    super("Sedative");

    this.reveal = options?.reveal;
    this.cursed = options?.cursed;

    this.meetings = {
      "Spike with Sedative": {
        actionName: "Throw",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["sedative"],
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
                `${this.actor.name} accidentally spiked their own drink with a sedative!`
              );
            else if (reveal && !cursed)
              this.game.queueAlert(
                `${this.actor.name} spikes ${this.target.name}'s drink with a sedative!`
              );
            else
              this.game.queueAlert(
                `Someone spikes ${this.target.name}'s drink with a sedative!`
              );

            if (this.dominates()) this.target.giveEffect("Sedate", this.actor);

            this.item.drop();
          },
        },
      },
    };
  }
};
