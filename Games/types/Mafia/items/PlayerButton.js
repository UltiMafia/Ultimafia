const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class PlayerButton extends Item {
  constructor(count, role, type) {
    super("PlayerButton");
    this.count = count;
    this.roleToUse = role;
    this.type = type || "A";
    this.baseMeetingName = "Choose Player "+ this.type +this.count;
    this.currentMeetingIndex = 0;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Select Player",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        targets: { include: ["alive", "dead"]},
        action: {
          item: this,
          run: function () {
            if(this.item.type == "A"){
              this.item.roleToUse.data.PlayerA = this.target;
            }
            else if(this.item.type == "B"){
              this.item.roleToUse.data.PlayerB = this.target;
            }
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
