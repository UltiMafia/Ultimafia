const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class TargetSelf50Percent extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_REDIRECT_ACTION,
        labels: ["block", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (Random.randInt(0, 1) == 0) {
             this.redirectAllActions(this.actor, this.actor);
          }
        },
      },
    ];
  }
};
