const Card = require("../../Card");

module.exports = class StartDrama extends Card {
  constructor(role) {
    super(role);
    role.data.canStartDrama = true;

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.data.meetingName = "Start drama";
      },
    };

    this.meetings = {
      "Start Drama": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["drama"],
          role: this.role,
          run: function () {
            this.target.holdItem(
              "Drama",
              this.role.data.meetingName,
              this.actor,
              this.target
            );
            this.target.queueAlert("Drama queen started drama with you!");
          },
        },
        shouldMeet: function (meetingName) {
          if (role.data.canStartDrama === true) return true;
        },
      },
    };
  }
};
