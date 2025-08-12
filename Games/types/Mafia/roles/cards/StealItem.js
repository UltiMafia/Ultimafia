const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT, PRIORITY_ITEM_TAKER_EARLY } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");

module.exports = class StealItem extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Steal From": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          role: this.role,
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_EARLY,
          run: function () {
            if(this.stealRandomItem() == null){
            this.role.PlayerToStealFrom = this.target;
            }
          },
        },
      },
    };

      this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Item"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          labels: ["stealItem"],
          run: function () {
            if(this.role.PlayerToStealFrom != null){
              this.stealRandomItem(this.role.PlayerToStealFrom, this.actor);
            }
            this.role.PlayerToStealFrom = null;
          },
        });

        this.game.queueAction(action);
      },
    };
    
  }
};
