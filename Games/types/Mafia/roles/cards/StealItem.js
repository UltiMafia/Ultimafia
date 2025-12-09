const Card = require("../../Card");
const {
  PRIORITY_ITEM_TAKER_DEFAULT,
  PRIORITY_ITEM_TAKER_EARLY,
} = require("../../const/Priority");
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
            if (this.stealRandomItem() == null) {
              this.role.PlayerToStealFrom = this.target;
            }
          },
        },
      },
    };

    this.passiveActions = [
      {
        ability: ["Item"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_ITEM_TAKER_DEFAULT,
        labels: ["stealItem"],
        run: function () {
            if (this.role.PlayerToStealFrom != null) {
              this.stealRandomItem(this.role.PlayerToStealFrom, this.actor);
            }
            this.role.PlayerToStealFrom = null;
          },
      },
    ];

  }
};
