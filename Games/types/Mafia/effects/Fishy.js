const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Fishy extends Effect {
  constructor() {
    super("Fishy");
  }

  apply(player) {
    if (player.hasEffect("Fishy")) {
      return;
    }

    super.apply(player);
    player.queueAlert("Your skin itches...");

    this.action = new Action({
      actor: this.player,
      target: player,
      game: this.player.game,
      labels: ["convert", "hidden"],
      delay: 1,
      effect: this,
      run: function () {
        if (this.dominates()) {
          this.target.setRole("Deep One");
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
