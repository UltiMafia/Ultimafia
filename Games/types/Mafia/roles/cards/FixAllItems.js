const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class FixAllItems extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Fix Items": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["fixItems"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT + 2,
          run: function () {
            for (let item of this.target.items) {
              item.cursed = false;
            }
          },
        },
      },
    };
  }
};
