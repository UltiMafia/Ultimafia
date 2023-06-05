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
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.actor.role.avengeTarget = this.target;
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
        if (player == this.avengeTarget) {
          let action = new Action({
            actor: this.player,
            target: this.player,
            game: this.game,
            run: function () {
              this.player.holdItem("Gun");
              this.queueGetItemAlert("Gun");
              this.effect.remove();
            },
          });

          action.do();
        }
      },
    };
  }
};
