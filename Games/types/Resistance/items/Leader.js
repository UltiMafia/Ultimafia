const Item = require("../Item");

module.exports = class Leader extends Item {
  constructor(game) {
    super("Leader");

    this.listeners = {
      state(stateInfo) {
        if (stateInfo.name.match(/Team Selection/)) {
          this.game.queueAlert(
            `${this.game.currentLeader.name} is the leader.`
          );
          this.game.queueAlert(`Team size: ${this.game.currentTeamSize}`);
        }
      },
    };
    this.meetings = {
      "Assemble Team": {
        states: ["Team Selection"],
        flags: ["voting", "multi", "mustAct"],
        targets: { include: ["alive"], exclude: [] },
        multiMin: game.currentTeamSize,
        multiMax: game.currentTeamSize,
        action: {
          run() {
            for (const player of this.game.players) {
              player.role.meetings["Mission Success"].disabled = true;
              player.role.meetings["Approve Team"].disabled = false;
            }

            for (const target of this.target)
              target.role.meetings["Mission Success"].disabled = false;

            this.actor.role.meetings["Approve Team"].disabled = true;

            const selectedNames = this.target.map((t) => t.name);
            // for displaying mission history
            this.game.recordMissionTeam(selectedNames);

            this.game.queueAlert(`Team selected: ${selectedNames.join(", ")}`);
            this.actor.dropItem("Leader");
          },
        },
      },
    };
  }
};
