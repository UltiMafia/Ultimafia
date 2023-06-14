const Card = require("../../Card");
const Winners = require("../../../../core/Winners");

module.exports = class TeamCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Group: {
        states: ["Team Selection", "Team Approval", "Mission"],
        flags: ["group", "speech"],
      },
      "Approve Team": {
        states: ["Team Approval"],
        flags: ["group", "voting", "mustAct", "includeNo"],
        inputType: "boolean",
        action: {
          run() {
            const teamApproved = this.target == "Yes";
            this.game.teamApproved = teamApproved;

            if (teamApproved)
              this.game.queueAlert("Team approved, beginning the mission.");
            else {
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
          run() {
            const missionSuccess = this.target == "Yes";

            if (!missionSuccess) this.game.currentMissionFails++;
          },
        },
      },
      "Identify Merlin": {
        states: ["Epilogue"],
        flags: ["group", "speech", "voting", "mustAct"],
        targetType: "player",
        targets: { include: ["Resistance"], exclude: [""] },
        canVote: false,
        action: {
          run() {
            let group = "Resistance";
            if (this.target.role.name === "Merlin") {
              group = "Spies";
            }
            const winners = new Winners(this.game);
            winners.addGroup(group);
            this.game.endGame(winners);
          },
        },
      },
    };
  }
};
