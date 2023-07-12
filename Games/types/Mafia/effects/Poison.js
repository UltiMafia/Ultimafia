const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Poison extends Effect {
  constructor(poisoner) {
    super("Poison");
    this.poisoner = poisoner;
  }

  apply(player) {
    this.action = new Action({
      actor: this.poisoner,
      target: player,
      game: this.poisoner.game,
      labels: ["kill", "poison", "hidden", "absolute", "uncontrollable"],
      delay: 1,
      effect: this,
      run: function () {
        if (this.dominates()) this.target.kill("poison", this.actor);

        this.effect.remove();
      },
    });

    if (this.action.dominates(player)) {
      this.game.queueAction(this.action)
    }

    super.apply(player);
  }

  remove() {
    super.remove();
    this.action.cancel(true);
  }
};
