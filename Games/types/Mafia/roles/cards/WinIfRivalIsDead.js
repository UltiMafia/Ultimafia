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
        let rivals = this.game
          .alivePlayers()
          .filter((p) => p.role.name == "Rival" && p != this.player);

        if (confirmedFinished && this.player.alive && rivals.length <= 0) {
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
          (p) => p.alive && p != this.player && p.role.name === "Rival"
        );

        if (eligibleRivals.length === 0) {
          this.player.queueAlert("You cannot find a worthy Rival…");
          this.player.setRole("Survivor");
          return;
        }
      },
      death: function (player, killer, deathType) {
        if (player != this.data.rival) return;
        this.data.deadRival = true;
      },
    };
  }
};
