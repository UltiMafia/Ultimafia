const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class RevolverGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Revolver": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "broken"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          role: this.role,
          run: function () {
            var itemType = this.role.data.LoadedChamber;

            this.target.holdItem("Revolver", null, this.actor, itemType);
            this.target.queueGetItemAlert("Revolver");
            delete this.role.data.LoadedChamber;
          },
        },
      },
      "Choose Loaded Chamber": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["1", "2", "3", "4", "5", "6"],
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 2,
          role: this.role,
          run: function () {
            this.role.data.LoadedChamber = this.target;
          },
        },
      },
    };
  }
};
