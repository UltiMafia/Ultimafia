const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class ReceiveBread extends Card {
  constructor(role) {
    super(role);

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
          priority: PRIORITY_ITEM_GIVER_EARLY,
          labels: ["giveItem", "bread", "hidden"],
          run: function () {
            for (let action of this.game.actions[0]) {
              if (action.target == this.actor && !action.hasLabel("hidden")) {
                action.actor.holdItem("bread");
                action.actor.queueGetItemAlert("Bread");
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
