const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class BallUnpaired extends Effect {
  constructor(lifespan) {
    super("Ball Unpaired");

    this.lifespan = lifespan || Infinity;

    this.listeners = {
      actionsNext: function () {
        if (!this.player.alive) return;

        if (this.game.getStateName() != "Night") return;

        let action = new Action({
          actor: this.player,
          target: this.player,
          effect: this,
          game: this.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "ballroom", "hidden", "absolute"],
          run: function () {
            this.player.kill("ballUnpaired", this.player, instant);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
