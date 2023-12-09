const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfAllVanilla extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        for (let p of this.game.alivePlayers()) {
          if (
            p.role.name === "Villager" ||
            p.role.name === "Mafioso" ||
            p.role.name === "Cultist" ||
            p.role.name === "Grouch"
          ) {
            vanillaCount = vanillaCount + 1;
          }
        }
        if (
          this.player.alive &&
          this.game.alivePlayers().filter((p) => p.role.name !== "Communist")
            .length === vanillaCount
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};
