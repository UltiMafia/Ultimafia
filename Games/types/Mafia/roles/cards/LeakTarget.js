const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class LeakTarget extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Plumbing: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["Block All", "Leak All"],
        action: {
          priority: PRIORITY_KILL_DEFAULT - 1,
          run: function () {
            this.actor.role.data.plumbType = this.target;
          },
        },
      },
      Plumb: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["leak"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.actor.role.data.plumbType && this.dominates()) {
              if (this.actor.role.data.plumbType === "Block All") {
                this.target.giveEffect("Block Whispers", 2);
              } else if (this.actor.role.data.plumbType === "Leak All") {
                this.target.giveEffect("Leak Whispers", 2);
              }
            }
            this.actor.role.data.plumbType = null;
          },
        },
      },
    };
  }
};