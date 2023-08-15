const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Alcoholic extends Effect {
  constructor() {
    super("Alcoholic");

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) return;
      },
      actionsNext: function (actionQueue) {
        if (!this.player.alive) return;

        const stateInfo = this.game.getStateInfo();

        if (!stateInfo.name.match(/Night/))
          return;

        const nonMafia = this.game.players.filter(
          (p) => p.role.alignment != "Mafia" && p.alive && p != this.player
        );
        const target = Random.randArrayVal(nonMafia);

        this.game.queueAction(
          new Action({
            actor: this.player,
            target: target,
            game: this.player.game,
            labels: ["block", "alcoholic"],
            run: function () {
              if (this.dominates()) this.target.blockActions(this.actor);
            },
          })
        );
      },
    };
  }
};
