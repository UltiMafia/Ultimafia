const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GetGunIfTargetDies extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Avenge: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.role.avengeTarget = this.target;
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        delete this.avengeTarget;
      },
      death: function (player) {
        if (this.avengeTarget && player == this.avengeTarget) {
          let action = new Action({
            actor: this.player,
            target: this.player,
            game: this.game,
            run: function () {
              this.actor.holdItem("Gun");
              this.actor.queueGetItemAlert("Gun");
            },
          });

          action.do();
        }
      },
    };
  }
};
