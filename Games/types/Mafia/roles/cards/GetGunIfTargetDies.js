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
          run() {
            this.actor.role.avengeTarget = this.target;
          },
        },
      },
    };

    this.listeners = {
      state(stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        delete this.avengeTarget;
      },
      death(player) {
        if (this.avengeTarget && player == this.avengeTarget) {
          const action = new Action({
            actor: this.player,
            target: this.player,
            game: this.game,
            run() {
              this.actor.holdItem("Gun");
              this.queueGetItemAlert("Gun");
            },
          });

          action.do();
        }
      },
    };
  }
};
