const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class TailorSuit extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Suit": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "suit"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            if (!this.actor.role.data.suit) {
              return;
            }

            this.target.holdItem("Suit", this.actor.role.data.suit);
            this.target.queueAlert(":suit: You have received a suit!");
            delete this.actor.role.data.suit;
          },
        },
      },
      "Choose Suit": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          labels: ["giveItem", "suit"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          run: function () {
            this.actor.role.data.suit = this.target;
          },
        },
      },
    };
  }
};
