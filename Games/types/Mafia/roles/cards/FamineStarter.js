const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class FamineStarter extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        this.game.famineStarted = true;

        for (const player of this.game.alivePlayers()) {
          const requiredBreadCount = 2;
          for (const i = 0; i < requiredBreadCount; i++) {
            player.holdItem("Bread");
          }

          player.giveEffect("Famished");
        }
      },
    };
  }
};
