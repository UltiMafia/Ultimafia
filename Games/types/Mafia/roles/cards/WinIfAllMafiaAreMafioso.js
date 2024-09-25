const Card = require("../../Card");
const { CULT_FACTIONS, MAFIA_FACTIONS } = require("../../const/FactionList");

module.exports = class WinIfAllMafiaAreMafioso extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      check: function (counts, winners) {
        if (!this.player.alive) {
          return;
        }

        let nonVanillaMafia = false;
        let nonVanillaCult = false;

        let MafiainGame = this.game.players.filter((p) =>
          MAFIA_FACTIONS.includes(p.faction)
        );
        let CultinGame = this.game.players.filter((p) =>
          CULT_FACTIONS.includes(p.faction)
        );

        if (MafiainGame.length <= 0) nonVanillaMafia = true;
        if (CultinGame.length <= 0) nonVanillaCult = true;

        for (let player of this.game.players) {
          if (
            MAFIA_FACTIONS.includes(player.faction) &&
            player.alive &&
            player.role.name != "Mafioso"
          ) {
            nonVanillaMafia = true;
          }
        }

        for (let player of this.game.players) {
          if (
            CULT_FACTIONS.includes(player.faction) &&
            player.alive &&
            player.role.name != "Cultist"
          ) {
            nonVanillaCult = true;
          }
        }

        if (nonVanillaMafia == false || nonVanillaCult == false) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};
