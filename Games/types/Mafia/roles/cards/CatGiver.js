const Card = require("../../Card");

module.exports = class CatGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Cat": {
        states: ["Day"],
        flags: ["voting", "noVeg"],
        action: {
          labels: ["giveItem", "cat"],
          run() {
            this.target.holdItem("Cat", this.actor);
            this.queueGetItemAlert("Cat");
          },
        },
      },
    };
  }
};
