const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_TAKER_DEFAULT, PRIORITY_ITEM_TAKER_EARLY } = require("../../const/Priority");

module.exports = class CorruptAllItems extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Corrupt: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["sabotage"],
          priority: PRIORITY_ITEM_TAKER_EARLY + 1,
          run: function () {
            this.role.PlayerToBreakItems = this.target;
            for (let item of this.target.items) {
              item.magicCult = true;
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
          priority: PRIORITY_ITEM_TAKER_DEFAULT+1,
          labels: ["sabotage"],
          run: function () {
            if(this.role.PlayerToBreakItems != null){
            for (let item of this.role.PlayerToBreakItems.items) {
               item.magicCult = true;
            }
            }
            this.role.PlayerToBreakItems = null;
          },
        });

        this.game.queueAction(action);
      },
    };
    
  }
};
