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
            if (!this.target.hasItem("Clover")) {
              this.stealRandomItem();
              return;
            }

            this.stealItemByName(
              "Clover",
              null,
              null,
              "You stole a four-leaf clover!"
            );
            this.target.queueAlert("Your four-leaf clover has been stolen!");
          },
        },
      },
    };
  }
};
