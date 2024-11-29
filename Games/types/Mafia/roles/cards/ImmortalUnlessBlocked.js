const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class ImmortalUnlessBlocked extends Card {
  constructor(role) {
    super(role);
/*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_SAVER,
        labels: ["save"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          this.actor.giveEffect("Immortal", 5, 1);
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

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_SAVER,
          labels: ["save"],
          run: function () {
  
            if (!this.actor.alive) return;
  
            this.actor.giveEffect("Immortal", 5, 1);
          },
        });

        this.game.queueAction(action);
      },
    };

  }
};
