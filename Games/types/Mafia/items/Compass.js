const Item = require("../Item");
const { PRIORITY_DAY_DEFAULT } = require("../const/Priority");
const { MEETING_PRIORITY_TEMPLARS } = require("../const/MeetingPriority");

module.exports = class Compass extends Item {
  constructor(reveal) {
    super("Compass");

    this.reveal = reveal;
    this.meetings = {
      "Visit Templars": {
        actionName: "Visit the Lodge tonight?",
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["springs", "compass"],
          priority: PRIORITY_DAY_DEFAULT,
          item: this,
          run: function () {
            if (this.target == "Yes") {
              this.actor.role.visitTemplars = true;
            }
          },
        },
      },
      "Templar Meeting": {
        actionName: "End Templar Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
        priority: MEETING_PRIORITY_TEMPLARS,
        shouldMeet: function () {
          return this.visitTemplars;
        },
      },
    };
    this.listeners = {
      actionsNext: function (stateInfo) {
        var stateInfo = this.game.getStateInfo();

        if (stateInfo.name.match(/Night/) && this.holder.role.visitTemplars) {
          this.drop();
          this.holder.role.visitTemplars = false;
        }
      },
    };
  }
};
