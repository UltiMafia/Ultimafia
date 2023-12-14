const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class TurnIntoTree extends Card {
  constructor(role) {
    super(role);
    this.meetings = {
      "Grow Into Tree?": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            if (this.target == "No") return;
            if (this.target === "Yes") {
              this.actor.giveEffect("Tree", 1);
              this.actor.role.isTree = true;
            }
          },
        },
        shouldMeet() {
          return !this.isTree;
        },
      },
    };
  }
};
