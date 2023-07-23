const Card = require("../../Card");

module.exports = class FamineStarter extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        if (this.game.famineStarted) {
          return;
        }

        this.game.famineStarted = true;

        for (const player of this.game.alivePlayers()) {
          const requiredBreadCount = 2;
          for (let i = 0; i < requiredBreadCount; i++) {
            player.holdItem("Bread");
            player.queueGetItemAlert("Bread");
          }

          player.giveEffect("Famished");
        }
      },
    };
  }
};
