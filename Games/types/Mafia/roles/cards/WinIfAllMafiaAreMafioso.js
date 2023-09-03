const Card = require("../../Card");

module.exports = class WinIfAllMafiaAreMafioso extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      check: function (counts, winners) {
        if (!this.player.alive) {
          return;
        }

        for (let player of this.game.players) {
          if (
            player.role.alignment == "Mafia" &&
            player.alive &&
            player.role.name != "Mafioso"
          ) {
            return;
          }
        }

        winners.addPlayer(this.player, this.name);
      },
    };
  }
};
