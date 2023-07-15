const Card = require("../../Card");

module.exports = class NounGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Card": {
        actionName: "Give Card",
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        action: {
          item: this,
          run: function () {
            this.game.recordExpandedNoun(this.actor, this.target);
          },
        },
      },
      shouldMeet() {
        return this.hasItem("ChefHat");
      }
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        this.meetings["Give Card"].targets = this.player.cards;
      },
    };
  }
};
