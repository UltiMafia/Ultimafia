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
          run: function () {
            var teamApproved = this.target == "Yes";
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
          run: function () {
            var missionSuccess = this.target == "Yes";

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
          run: function () {
            const winnerGroup =
              this.target.role.name === "Merlin" ? "Spies" : "Resistance";
            const winners = new Winners(this.game);
            winners.addGroup(winnerGroup);
            for (let player of this.game.players) {
              if (player.role.alignment !== winnerGroup) {
                player.kill();
              } else {
                winners.addPlayer(player);
              }
            }
            this.game.endGame(winners);
          },
        },
      },
    };
  }
};
