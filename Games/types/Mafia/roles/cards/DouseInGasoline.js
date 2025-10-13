const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class DouseInGasoline extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Match"];

    this.actions = [
      {
        labels: ["dropItems", "hidden"],
        priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
        run: function () {
          for (let item of this.actor.items) {
            if (item.name === "Match") {
              if (this.actor.role.name === "Pyromaniac") {
                item.reusable = true;
              } else {
                item.reusable = false;
              }
            }
          }
        },
      },
    ];

    this.meetings = {
      "Douse Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: role,
          labels: ["effect", "gasoline"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.role.giveEffect(this.target, "Gasoline");
          },
        },
      },
    };
  }
};
