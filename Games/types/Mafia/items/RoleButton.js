const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class RoleButton extends Item {
  constructor(count, role, type) {
    super("RoleButton");
    this.count = count;
    this.roleToUse = role;
    this.type = type || "A";
    this.baseMeetingName = "Choose Role " + this.type + this.count;
    this.currentMeetingIndex = 0;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Select Role",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "AllRoles",
        AllRolesFilters: ["addedRoles"],
        action: {
          item: this,
          run: function () {
            if (this.item.type == "A") {
              this.item.roleToUse.data.RoleA = this.target;
            } else if (this.item.type == "B") {
              this.item.roleToUse.data.RoleB = this.target;
            }
            this.game.events.emit("questionInfo", this.item.roleToUse);
            this.item.drop();
          },
        },
      },
    };
  }

  getMeetingName(idx) {
    return `${this.id} ${idx}`;
  }

  getCurrentMeetingName() {
    if (this.currentMeetingIndex === 0) {
      return this.baseMeetingName;
    }

    return this.getMeetingName(this.currentMeetingIndex);
  }

  // increase meeting name index to ensure each meeting name is unique
  incrementMeetingName() {
    let mtg = this.meetings[this.getCurrentMeetingName()];
    delete this.meetings[this.getCurrentMeetingName()];
    this.currentMeetingIndex += 1;
    this.meetings[this.getCurrentMeetingName()] = mtg;
  }
};
