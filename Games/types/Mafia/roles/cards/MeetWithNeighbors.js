const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class MeetWithNeighbors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (
            this.game.getStateName() != "Dusk" &&
            this.game.getStateName() != "Day"
          )
            return;

          const neighbors = this.getAliveNeighbors();

          for (let neighbor of neighbors) {
            neighbor.holdItem(
              "WackyJoinFactionMeeting",
              `Neighbors with ${this.player.name}`
            );
          }
          this.actor.holdItem(
            "WackyJoinFactionMeeting",
            `Neighbors with ${this.player.name}`
          );
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (this.player !== player) {
          return;
        }

        const neighbors = this.getAliveNeighbors();

        for (let neighbor of neighbors) {
          neighbor.holdItem(
            "WackyJoinFactionMeeting",
            `Neighbors with ${this.player.name}`
          );
        }
        this.player.holdItem(
          "WackyJoinFactionMeeting",
          `Neighbors with ${this.player.name}`
        );
      },
    };
  }
};
