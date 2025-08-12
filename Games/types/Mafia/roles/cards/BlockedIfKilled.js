const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_BLOCK_SELF_IF_KILLED } = require("../../const/Priority");

module.exports = class BlockedIfKilled extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_BLOCK_SELF_IF_KILLED,
          labels: ["block", "hidden"],
          run: function () {
            if (!this.actor.alive) {
              this.blockActions(this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
