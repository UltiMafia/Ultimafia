const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class Polarised extends Effect {
  constructor(bear) {
    super("Polarised");

    this.bear = bear;
    this.listeners = {
      actionsNext() {
        if (!this.player.alive) return;

        if (this.game.getStateName() != "Night") return;

        const action = new Action({
          actor: this.player,
          target: this.player,
          effect: this,
          game: this.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "polarised", "hidden", "absolute"],
          run() {
            const visitors = this.getVisitors(this.actor);
            for (const v of visitors) {
              if (!v.hasEffect("Polarised")) {
                continue;
              }

              if (this.dominates(this.actor)) {
                this.actor.kill("polarised", this.effect.bear);
              }

              if (this.dominates(v)) {
                v.kill("polarised", this.effect.bear);
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
