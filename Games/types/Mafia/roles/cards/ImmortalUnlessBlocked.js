const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class ImmortalUnlessBlocked extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_NIGHT_SAVER,
        labels: ["save"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

              this.actor.giveEffect("Immortal",5,1);
        },
      },
    ];
  }
};
