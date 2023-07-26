const Card = require("../../Card");

module.exports = class RevealScumToRole extends Card {
  constructor(role) {
    super(role);

    this.methods = {
      revealScum: function () {
        for (const player of this.game.players) {
          if (
            player.alive &&
            player.role.alignment === "Mafia" &&
            player.role.alignment === "Cult" &&
            player.role.name !== "Politician"
          ) {
            player.role.revealToPlayer(this.player);
          }
        }
        this.data.revealedScum = true;
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (
          this.data.hasStarted &&
          !this.data.revealedScum &&
          player === this.player
        ) {
          this.methods.revealScum();
        }
      },
      start: function () {
        this.methods.revealScum();
        this.data.hasStarted = true;
      },
    };
  }
};