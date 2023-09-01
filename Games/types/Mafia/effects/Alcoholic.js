const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class Alcoholic extends Effect {
  constructor() {
    super("Alcoholic");

    this.listeners = {
      state: function () {
        if (this.game.getStateName() != "Night") return;
        if (!this.player.alive) return;
        
        const nonMafia = this.game.players.filter(
          (p) => p.role.alignment != "Mafia" && p.alive && p != this.player
        );
        const target = Random.randArrayVal(nonMafia);

        var action = new Action({
          labels: ["block", "alcoholic"],
          actor: this.player,
          target: target,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          run: function () {
            this.blockActions();
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
