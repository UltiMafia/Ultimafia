const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CanHex extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Hex: {
        actionName: "Hex",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "hex"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            this.target.holdItem("Hex");
            this.target.giveEffect("Insanity", 1);
          },
        },
      },
    };
  }
};
