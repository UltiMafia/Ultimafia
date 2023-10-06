const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class TurnIntoTree extends Card {
  constructor(role) {
    super(role);
    this.role.data.tree = false;
    this.meetings = {
      "Grow Into Tree?": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            if (this.target === "Yes") {
              this.actor.setRole(`Tree`, this.actor.role.data, true);
              this.actor.queueAlert(":tree: You grow into a tree!");
              this.actor.role.revealToAll();
            }
          },
        },
      },
    };
  }
};
