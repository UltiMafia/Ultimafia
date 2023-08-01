const Role = require("../../Role");

module.exports = class President extends Role {
  constructor(player, data) {
    super("President", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage",];
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.role.data.position = this.player.role.modifier;
        if (this.player.role.name === "President") {
          this.player.role.data.position = this.player.role.name;
        }

        this.game.queueAlert(
          `${this.player.name} has been elected as the ${this.player.role.data.position}! Protect them at all costs!`,
          0,
          this.game.players.filter(
            (p) => p.role.alignment === this.player.role.alignment
          )
        );
      },
    };
  }
};
