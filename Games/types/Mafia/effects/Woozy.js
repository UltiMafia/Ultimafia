const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class Woozy extends Effect {
  constructor(gasser) {
    super("Woozy");
    this.gasser = gasser;
    this.isMalicious = true;
  }

  apply(player) {
    super.apply(player);
    this.player.queueAlert(":poison: You have become Woozy after seeing the Dentist! You will die if you visit someone tonight!", 0);

    this.action = new Action({
      actor: this.gasser,
      target: player,
      game: this.gasser.game,
      labels: ["kill", "woozy", "hidden", "absolute", "uncontrollable"],
      effect: this,
      delay: 1,
      priority: PRIORITY_KILL_DEFAULT,
      run: function () {
        if (!this.target.hasEffect("Woozy")) {
          return;
        }
        const visits = this.getVisits(this.target);
        if (visits.length > 0) {
          this.target.kill("basic", this.actor);
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
