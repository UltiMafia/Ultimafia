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
          run: function () {
              if (!this.actor.hasAbility(["Effect"])) {
              return;
             }
            this.target.holdItem("Cat", this.actor);
            this.target.queueGetItemAlert("Cat");
          },
        },
      },
    };
  }
};
