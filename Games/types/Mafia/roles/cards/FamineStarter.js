const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class FamineStarter extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        this.game.famineStarted = true;

        for (const player of this.game.alivePlayers()) {
          // give bread
          let breadCount = 0;

          while (breadCount < 2) {
            player.holdItem("Bread");
            breadCount++;
          }

          // give effect
          if (!player.hasEffect("Famished")) player.giveEffect("Famished");
        }
      },
    };
  }
};
