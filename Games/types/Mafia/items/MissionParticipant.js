const Item = require("../Item");

module.exports = class MissionParticipant extends Item {
  constructor() {
    super("MissionParticipant");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.lifespan = Infinity;

    this.meetings = {
      Group: {
        states: ["Night", "Team Approval", "Mission"],
        flags: ["group", "speech"],
      },
      "Approve Team": {
        states: ["Team Approval"],
        flags: ["group", "voting", "mustAct", "includeNo"],
        inputType: "boolean",
        action: {
          run: function () {
            var teamApproved = this.target == "Yes";
            this.game.teamApproved = teamApproved;

            if (teamApproved) {
              this.game.queueAlert("Team approved, beginning the mission.");
            } else {
              this.game.teamFails++;
              this.game.currentTeamFail = true;
              this.game.queueAlert("Team was rejected by the group.");
            }
          },
        },
      },
      "Mission Success": {
        states: ["Mission"],
        flags: ["voting", "mustAct"],
        inputType: "boolean",
        disabled: true,
        action: {
          run: function () {
            var missionSuccess = this.target == "Yes";
            if (!missionSuccess) {
              this.game.currentMissionFails++;
            }
          },
        },
      },
    };
  }
};
