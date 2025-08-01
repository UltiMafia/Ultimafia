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
          role: this.role,
          labels: ["giveItem", "suit"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            if (!this.role.data.suit) {
              return;
            }

            this.target.holdItem("Suit", { type: this.role.data.suit });
            //this.target.queueAlert(":suit: You have received a suit!");
            delete this.role.data.suit;
          },
        },
      },
      "Choose Suit": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        inputType: "AllRoles",
        action: {
          role: this.role,
          labels: ["giveItem", "suit"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          run: function () {
            this.role.data.suit = this.target;
          },
        },
      },
    };
  }
};
