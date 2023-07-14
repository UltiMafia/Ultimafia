const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealAllItemsAndClovers extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Steal From": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        action: {
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run: function () {
            // TODO golb what is steal item = false? always false
            let stealItem = false;
            if (stealItem) {
              if (this.target.hasItem("Clover")) {
                this.stealItemByName(
                  "Clover",
                  null,
                  null,
                  "You stole a four-leaf clover!"
                );
                this.target.queueGetItemAlert("Clover");
              } else {
                this.stealRandomItem();
              }
            }
          },
        },
      },
    };
  }
};
