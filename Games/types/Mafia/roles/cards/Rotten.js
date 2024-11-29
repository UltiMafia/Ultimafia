const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class Rotten extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          //if (!this.actor.alive) return;

          this.blockWithMindRot(this.actor);
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        const target_list = this.game.players.filter((p) => p.alive);
        const target = Random.randArrayVal(target_list);

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["block", "hidden", "absolute"],
          run: function () {
            //if (!this.actor.alive) return;

            this.blockWithMindRot(this.actor);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
