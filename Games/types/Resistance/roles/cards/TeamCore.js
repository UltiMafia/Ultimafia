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
            if (this.actor.role.name == "Lunatic") {
              missionSuccess = false;
            }

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
        displayOptions: {
          disableShowDoesNotVote: true,
        },
        action: {
          priority: 2,
          run: function () {
            let winnerGroup =
              this.target.role.name === "Merlin" ? "Spies" : "Resistance";
            if (this.game.FirstLover != null && this.game.SecondLover != null) {
              return;
            }
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
        shouldMeet: function () {
          let Merlins = this.game.players.filter(
            (p) => p.role.name == "Merlin"
          );

          if (Merlins.length <= 0) {
            return false;
          }

          let assassins = this.game.players.filter(
            (p) => p.role.name == "Assassin"
          );
          return assassins.length <= 0;
        },
      },
      "Identify First Lover": {
        states: ["Epilogue"],
        displayOptions: {
          disableShowDoesNotVote: true,
        },
        flags: ["group", "speech", "voting"],
        targetType: "player",
        targets: { include: ["Resistance"], exclude: [""] },
        canVote: false,
        action: {
          priority: 0,
          run: function () {
            this.game.FirstLover = this.target;
          },
        },
        shouldMeet: function () {
          let Lovers = this.game.players.filter(
            (p) => p.role.name == "Isolde" || p.role.name == "Tristan"
          );

          if (Lovers.length <= 1) {
            return false;
          }

          let assassins = this.game.players.filter(
            (p) => p.role.name == "Assassin"
          );
          return assassins.length <= 0;
        },
      },
      "Identify Second Lover": {
        states: ["Epilogue"],
        displayOptions: {
          disableShowDoesNotVote: true,
        },
        flags: ["group", "voting"],
        targetType: "player",
        targets: { include: ["Resistance"], exclude: [""] },
        canVote: false,
        action: {
          priority: 1,
          run: function () {
            this.game.SecondLover = this.target;
            if (this.game.FirstLover != null) {
              let winnerGroup;
              if (
                this.game.FirstLover.role.name == "Tristan" ||
                this.game.FirstLover.role.name == "Isolde"
              ) {
                if (this.game.FirstLover != this.target) {
                  if (
                    this.target.role.name == "Tristan" ||
                    this.target.role.name == "Isolde"
                  ) {
                    winnerGroup = "Spies";
                  } else {
                    winnerGroup = "Resistance";
                  }
                }
              } else {
                winnerGroup = "Resistance";
              }

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
            }
          },
        },
        shouldMeet: function () {
          let Lovers = this.game.players.filter(
            (p) => p.role.name == "Isolde" || p.role.name == "Tristan"
          );

          if (Lovers.length <= 1) {
            return false;
          }

          let assassins = this.game.players.filter(
            (p) => p.role.name == "Assassin"
          );
          return assassins.length <= 0;
        },
      },
    };
  }
};
