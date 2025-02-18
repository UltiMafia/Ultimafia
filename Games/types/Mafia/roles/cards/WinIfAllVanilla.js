const Card = require("../../Card");

module.exports = class WinIfAllVanilla extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      check: function (counts, winners) {
        let communists = this.game.alivePlayers().filter((p) => p.role.name == "Communist");
        if (communists.length <= 0) {
          return;
        }

        for (let player of this.game.players) {
          if (
            player.alive &&
            player.role.name != "Villager" &&
            player.role.name != "Mafioso" &&
            player.role.name != "Cultist" &&
            player.role.name != "Grouch" &&
            player.role.name != "Communist"
          ) {
            return;
          }
        }

        winners.addPlayer(this.player, this.name);
      },
    };
  }
};
