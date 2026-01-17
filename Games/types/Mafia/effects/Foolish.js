const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class Foolish extends Effect {
  constructor(killer) {
    super("Foolish");
    this.killer = killer;
    this.isMalicious = true;
  }

  apply(player) {
    if (player.hasEffect("Foolish")) {
      return;
    }

    super.apply(player);

    this.action = new Action({
      actor: this.killer,
      target: player,
      game: this.killer.game,
      labels: ["convert", "hidden", "absolute", "uncontrollable"],
      delay: 1,
      effect: this,
      run: function () {
        if (!this.target.hasEffect("Foolish")) {
          return;
        }
        if (this.dominates()) {
          this.target.setRole("Fool");
        }

        this.effect.remove();
      },
    });

    this.game.queueAction(this.action);
  }

  remove() {
    super.remove();
    this.action.cancel(true);
  }
};
