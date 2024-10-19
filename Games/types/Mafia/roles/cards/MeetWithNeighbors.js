const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class MeetWithNeighbors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: 0,
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
              `Neighbors with ${this.actor.name}`
            );
          }
          this.actor.holdItem(
            "WackyJoinFactionMeeting",
            `Neighbors with ${this.actor.name}`
          );
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (this.player !== player) {
          return;
        }
        let alive = this.game.alivePlayers();
        let playerIndex = alive.indexOf(this.player);
        let leftIdx = (playerIndex - 1 + alive.length) % alive.length;
        let rightIdx = (playerIndex + 1) % alive.length;
        const neighbors = [alive[leftIdx],alive[rightIdx]];

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
