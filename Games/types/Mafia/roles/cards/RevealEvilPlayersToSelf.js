const Card = require("../../Card");

module.exports = class RevealEvilPlayersToSelf extends Card {
  constructor(role) {
    super(role);

    role.methods = {
      revealEvilPlayers: function () {
        for (const player of this.game.players) {
          if (
            player.alive &&
            player.role.name !== "Politician" &&
            (player.role.alignment === "Mafia" ||
              player.role.alignment === "Cult")
          ) {
            player.role.revealToPlayer(this.player);
          }
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player != this.player) {
          return;
        }

        if(!this.hasAbility(["Information"])){
          return;
        }

        let info = this.game.createInformation(
          "RevealEvilPlayersInfo",
          this.player,
          this.game
        );
        info.processInfo();
        info.getInfoRaw();
        //this.methods.revealEvilPlayers();
      },
    };
  }
};
