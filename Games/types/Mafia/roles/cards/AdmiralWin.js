const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class AdmiralWin extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 2,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        for (let person of this.game.alivePlayers()) {
          if (person.hasItem("TreasureChest")) {
            return;
          }
        }
        let village = this.game.players.filter((p) => p.faction == "Village");
        let other = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p.role.name != "Host" &&
              p.role.name != "Grouch" &&
              p.role.name != "Admiral"
          );

        if (this.player.alive && other.length <= 0 && village.length <= 0) {
          winners.addPlayer(this.player, this.name);
        }
        if (winners.groups["Village"]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};
