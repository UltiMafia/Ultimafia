const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfAlive extends Card {
  constructor(role) {
    super(role);

    this.winCount = "Village";
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        const magusInGame = this.game.players.filter(
          (p) => p.role.name == "Magus"
        );
        const admiralInGame = this.game.players.filter(
          (p) => p.role.name == "Admiral" && p.alive
        );
        if (
          this.player.alive &&
          ((!confirmedFinished &&
            counts["Village"] == aliveCount &&
            admiralInGame.length <= 0 &&
            magusInGame.length <= 0) || // Only Suvivors remain
            (confirmedFinished))
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};
