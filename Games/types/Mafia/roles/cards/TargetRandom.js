const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class TargetRandom extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Redirection", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_REDIRECT_ACTION - 1,
          labels: ["block", "hidden", "absolute"],
          run: function () {
            let players = this.game
              .alivePlayers()
              .filter((p) => p != this.actor);
            if (Random.randInt(0, 1) == 0) {
              this.redirectAllActions(this.actor, Random.randArrayVal(players));
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
