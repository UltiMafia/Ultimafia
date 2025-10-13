const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Poison extends Effect {
  constructor(poisoner) {
    super("Poison");
    this.poisoner = poisoner;
    this.isMalicious = true;
  }

  apply(player) {
    super.apply(player);
    if (this.poisoner.role.name != "Puca") {
      this.player.queueAlert(
        ":poison: You feel sick, as though you have been poisoned!",
        0
      );
    }

    this.action = new Action({
      actor: this.poisoner,
      target: player,
      game: this.poisoner.game,
      labels: ["kill", "poison", "hidden", "absolute", "uncontrollable"],
      delay: 1,
      effect: this,
      power: 2,
      run: function () {
        if (this.actor.role.name == "Puca") {
          if (this.dominates()) this.target.kill("basic", this.actor);
        } else {
          if (this.dominates()) this.target.kill("poison", this.actor);
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
