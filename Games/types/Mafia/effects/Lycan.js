const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class Lycan extends Effect {
  constructor() {
    super("Lycan");
    this.isMalicious = true;

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) return;

        if (
          stateInfo.name.match(/Night/) &&
          this.game.stateEvents["Full Moon"] == true
        ) {
          const nonCult = this.game.players.filter(
            (p) => p.getRoleAlignment() != "Cult" && p.alive && p != this.player
          );
          const target = Random.randArrayVal(nonCult);
          this.game.queueAction(
            new Action({
              actor: this.player,
              target: target,
              game: this.player.game,
              labels: ["kill", "lycan"],
              priority: PRIORITY_KILL_DEFAULT,
              run: function () {
                if (!this.actor.hasEffect("Lycan")) {
                  return;
                }
                if (this.dominates()) this.target.kill("basic", this.actor);
              },
            })
          );
        }
      },
    };
  }
};
