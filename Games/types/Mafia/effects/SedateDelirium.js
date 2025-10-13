const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class SedateDelirium extends Effect {
  constructor(doer) {
    super("SedateDelirium");
    this.doer = doer;
    this.isMalicious = true;
  }

  apply(player) {
    super.apply(player);

    this.action = new Action({
      actor: this.doer,
      target: player,
      labels: ["block"],
      priority: PRIORITY_NIGHT_ROLE_BLOCKER,
      delay: 1,
      effect: this,
      game: this.game,
      run: function () {
        this.blockWithDelirium();
        this.effect.remove();
      },
    });

    this.game.queueAction(this.action);
  }

  remove() {
    super.remove();
    this.action.cancel();
  }
};
