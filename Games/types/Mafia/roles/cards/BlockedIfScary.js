const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_BLOCK_EARLY } = require("../../const/Priority");

module.exports = class BlockedIfScary extends Card {
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
          priority: PRIORITY_BLOCK_EARLY,
          labels: ["block", "hidden"],
          run: function () {
            let ScaryPlayers = this.game.alivePlayers().filter((p)=> p.hasEffect("Scary"));

            if (ScaryPlayers.length > 0) {
              this.blockActions(this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
