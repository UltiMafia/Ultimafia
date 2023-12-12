const Card = require("../../Card");

module.exports = class WinIfAllVanilla extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      check: function (counts, winners) {
        if (!this.player.alive) {
          return;
        }

        for (let player of this.game.players) {
          if (
            player.alive &&
            player.role.name != "Villager" ||
            player.role.name != "Mafioso" ||
            player.role.name != "Cultist" ||
            player.role.name != "Grouch"
          ) {
            return;
          }
        }

        winners.addPlayer(this.player, this.name);
      },
    };
  }
};
