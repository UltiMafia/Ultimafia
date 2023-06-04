const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

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
