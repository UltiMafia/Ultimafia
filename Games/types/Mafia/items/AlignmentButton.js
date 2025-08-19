const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class AlignmentButton extends Item {
  constructor(role, type) {
    super("AlignmentButton");
    this.roleToUse = role;
    this.type = type || "A";
    this.baseMeetingName = "Choose Alignment " + this.type;
    this.currentMeetingIndex = 0;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Select Role",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "custom",
        targets: ["Village", "Mafia", "Cult", "Independent"],
        action: {
          item: this,
          run: function () {
            this.item.roleToUse.data.Alignment = this.target;
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
