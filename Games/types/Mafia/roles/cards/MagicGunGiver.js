const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MagicGunGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Gun": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          labels: ["giveItem", "gun"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Gun", { magicBullet: true });
            this.target.queueGetItemAlert("Gun");
          },
        },
      },
    };
  }
};
