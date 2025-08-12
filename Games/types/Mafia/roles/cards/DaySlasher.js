const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class DaySlasher extends Card {
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
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          labels: ["hidden", "absolute"],
          run: function () {
            if (!this.actor.alive) return;

            if (!this.hasVisitors()) {
              this.actor.holdItem("Knife", { reveal: false });
              this.actor.queueGetItemAlert("Knife");
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
