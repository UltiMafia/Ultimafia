const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Provocative extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        if (!this.player.alive) return;

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          labels: ["hidden", "absolute"],
          run: function () {
            // Prevent trollbox stacking across multiple days
            for (let item of this.actor.items) {
              if (item.name === "Trollbox") {
                item.drop();
              }
            }

            this.actor.holdItem("Trollbox", { reveal: false });
            this.actor.queueGetItemAlert("Trollbox");
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
