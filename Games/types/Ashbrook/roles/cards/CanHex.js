const Card = require("../../Card");
const { PRIORITY_INSANITY } = require("../../const/Priority");

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
          priority: PRIORITY_INSANITY,
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
