const Item = require("../Item");

module.exports = class MissionLeader extends Item {
  constructor(game) {
    super("MissionLeader");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.lifespan = 1;

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.game.queueAlert(
            `${this.game.currentLeader.name} is the leader.`
          );
          this.game.queueAlert(`Team size: ${this.game.currentTeamSize}`);
        }
      },
    };

    this.meetings = {
      "Assemble Team": {
        states: ["Night"],
        flags: ["voting", "multi", "mustAct"],
        targets: { include: ["alive"], exclude: [] },
        multiMin: game.currentTeamSize,
        multiMax: game.currentTeamSize,
        action: {
          run: function () {
            for (let player of this.game.players) {
              for (let meeting of player.getMeetings()) {
                if (meeting.name === "Mission Success") {
                  meeting.disabled = true;
                }
                if (meeting.name === "Approve Team") {
                  meeting.disabled = false;
                }
              }
            }

            for (let target of this.target) {
              for (let meeting of target.getMeetings()) {
                if (meeting.name === "Mission Success") {
                  meeting.disabled = false;
                }
              }
            }

            var selectedNames = this.target.map((t) => t.name);
            this.game.recordMissionTeam(selectedNames);
            this.game.queueAlert(`Team selected: ${selectedNames.join(", ")}`);
            this.holder.dropItem("MissionLeader");
          },
        },
      },
    };
  }
};
