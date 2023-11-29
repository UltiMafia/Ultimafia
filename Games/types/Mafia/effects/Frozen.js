const Effect = require("../Effect");

module.exports = class Frozen extends Effect {
  constructor(power, lifespan) {
    super("Frozen");
  }
  apply(player) {
    super.apply(player);

    player.role.meetings["*"].canVote = false;

    this.action = new Action({
      actor: this.actor,
      target: this.player,
      game: this.game,
      labels: ["visit"],
      effect: this,
      run: function () {
        if (this.game.getStateName() != "Night") return;

        for (let action of this.game.actions[0]) {
          if (action.target == this.actor && !action.hasLabel("hidden")) {
            this.effect.remove();
          }
        }
      },
    });
  }
};
