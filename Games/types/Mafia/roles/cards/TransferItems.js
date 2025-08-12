const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT, PRIORITY_ITEM_TAKER_EARLY } = require("../../const/Priority");
const Action = require("../../Action");

module.exports = class TransferItems extends Card {
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
          priority: PRIORITY_ITEM_TAKER_EARLY - 1,
          run: function () {
            this.role.data.victim = this.target;
          },
        },
      },
      "Give To": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          role: this.role,
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_EARLY,
          run: function () {
            if (
              typeof this.role.data.victim === "undefined" ||
              this.target.role.alignment === "Mafia"
            )
              return;

            this.stealAllItems(this.role.data.victim, this.target);
            this.role.PlayerToStealFrom = this.target;
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
            if(this.role.PlayerToStealFrom != null && this.role.data.victim != null){
              this.stealRandomItem(this.role.data.victim, this.role.PlayerToStealFrom);
            }
            this.role.PlayerToStealFrom = null;
            this.role.data.victim = null;
          },
        });

        this.game.queueAction(action);
      },
    };

    
  }
};
