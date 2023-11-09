const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveTommyGun extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Tommy Gun": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["giveItem", "gun"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Gun", { mafiaImmune: true });
            this.target.queueGetItemAlert("Gun");
          },
        },
      },
    };
  }
};
