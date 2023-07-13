const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Bleeding extends Effect {
  constructor(killer) {
    super("Bleeding");
    this.killer = killer;
  }

  apply(player) {
    super.apply(player);

    this.action = new Action({
      actor: this.killer,
      target: player,
      game: this.killer.game,
      labels: ["kill", "bleed", "hidden", "absolute", "uncontrollable"],
      delay: 1,
      effect: this,
      run: function () {
        if (this.dominates()) {
          this.target.kill("bleed", this.actor);
        }

        this.effect.remove();
      },
    });

    if (!player.getImmunity("bleed")) {
      this.game.queueAction(this.action);
    } else {
      this.remove();
    }
  }

  remove() {
    super.remove();
    this.action.cancel(true);
  }
};