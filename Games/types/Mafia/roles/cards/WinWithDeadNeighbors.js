const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithDeadNeighbors extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = 0;

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners) {
        if (
          this.player.alive &&
          !winners.groups[this.name] &&
          this.startingNeigbors &&
          !this.startingNeigbors[0].alive &&
          !this.startingNeigbors[1].alive
        ) {
          winners.addPlayer(this.player, this.name);
        }

        if (!this.canDoSpecialInteractions()) {
          return;
        }
        if (
          this.player.alive &&
          this.game.IsBloodMoon &&
          !winners.groups[this.name] &&
          this.startingNeigbors &&
          this.HasKilledANeighborDuringBloodMoon
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        let alive = this.game.alivePlayers();
        let playerIndex = alive.indexOf(this.player);
        let leftIdx = (playerIndex - 1 + alive.length) % alive.length;
        let rightIdx = (playerIndex + 1) % alive.length;
        const neighbors = [alive[leftIdx], alive[rightIdx]];
        this.startingNeigbors = neighbors;
        this.player.queueAlert(
          `You want these annoying neighbors gone to bring up your property value.`
        );
      },
      death: function (player) {
        if (
          this.game.IsBloodMoon &&
          this.player.alive &&
          this.startingNeigbors.includes(player)
        ) {
          this.HasKilledANeighborDuringBloodMoon = true;
        }
      },
    };
  }
};
