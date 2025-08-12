const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_SELF_BLOCK_POST_BLOCK } = require("../../const/Priority");

module.exports = class BlockIfVisited extends Card {
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
          priority: PRIORITY_SELF_BLOCK_POST_BLOCK,
          labels: ["block", "hidden"],
          run: function () {
            if (this.hasVisitors() === true) {
              this.blockActions(this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
