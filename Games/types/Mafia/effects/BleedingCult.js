const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class BleedingCult extends Effect {
  constructor(killer) {
    super("BleedingCult");
    this.killer = killer;
    this.isMalicious = true;
  }

  apply(player) {
    if (player.hasEffect("BleedingCult")) {
      return;
    }

    super.apply(player);
    player.queueAlert("You start to bleed…");

    this.action = new Action({
      actor: this.killer,
      target: player,
      game: this.killer.game,
      labels: ["convert", "bleed", "hidden", "absolute", "uncontrollable"],
      delay: 1,
      effect: this,
      run: function () {
        if (this.dominates()) {
          if (this.target.role.alignment == "Cult") return;
          this.target.setRole("Cultist");
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
