const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const { PRIORITY_SELF_BLOCK_EARLY, PRIORITY_SELF_BLOCK_LATER } = require("../../const/Priority");

module.exports = class Unrefined extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Blocking", "Modifier"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_SELF_BLOCK_EARLY,
          labels: ["block", "hidden", "absolute"],
          role: this,
          run: function () {
            if(!this.isSelfBlock()){
              return;
            }
             this.blockingMods(this.role);
          },
        });
        var action2 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_SELF_BLOCK_LATER,
          labels: ["block", "hidden", "absolute"],
          role: this,
          run: function () {
            this.blockingMods(this.role);
          },
        });

        this.game.queueAction(action);
        this.game.queueAction(action2);
      },
    };
  }
};
