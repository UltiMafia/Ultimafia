const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfRivalIsDead extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (
          this.player.alive &&
          this.data.rival &&
          !this.data.rival.alive &&
          confirmedFinished
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
        if (this.player.role.data.rival) {
          return;
        }

        const otherRivals = this.game
          .alivePlayers()
          .filter((e) => e.role.name === "Rival");
        const freeRival = otherRivals.find(
          (e) => !e.role.data.rival && this.player !== e
        );
        if (freeRival) {
          this.player.role.data.rival = freeRival;
          this.player.queueAlert(`${freeRival.name} is your rival!`);
          freeRival.role.data.rival = this.player;
          freeRival.queueAlert(`${this.player.name} is your rival!`);
        } else {
          this.player.queueAlert("You can't find a worthy rival...");
        }
      },
    };
  }
};
