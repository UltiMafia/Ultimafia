const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class WinIfRivalIsDead extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (
          confirmedFinished &&
          this.player.alive &&
          this.data.rival &&
          !this.data.rival.alive
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

        if (this.data.rival) {
          return;
        }

        const eligibleRivals = this.game.players.filter(
          (p) =>
            p.alive &&
            p != this.player &&
            p.role.name === "Rival" &&
            !p.role.data.rival
        );

        if (eligibleRivals.length === 0) {
          this.player.queueAlert("You cannot find a worthy Rival...");
          this.player.setRole("Survivor");
          return;
        }

        const chosenRival = Random.randArrayVal(eligibleRivals);
        this.data.rival = chosenRival;
        this.player.queueAlert(`${chosenRival.name} is your rival!`);
        chosenRival.role.data.rival = this.player;
        chosenRival.queueAlert(`${this.player.name} is your rival!`);
      },
    };
  }
};
