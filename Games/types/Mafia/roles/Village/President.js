const Role = require("../../Role");

module.exports = class President extends Role {
  constructor(player, data) {
    super("President", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
    this.listeners = {
      roleAssigned: [
        function (player) {
          if (player !== this.player) {
            return;
          }

          this.game.queueAlert(
            `${this.player.getRoleAppearance("reveal")} ${this.player.name}'s motorcade has broken down on the outskirts of town... the Villagers must protect them from assassination by the Mafia!`,
            0,
            this.game.players.filter(
              (p) =>
                p.role.alignment === this.player.role.alignment &&
                p != this.player
            )
          );
        },
      ],
    };
  }
};
