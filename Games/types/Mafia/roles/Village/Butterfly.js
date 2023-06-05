const Role = require("../../Role");

module.exports = class Butterfly extends Role {
  constructor(player, data) {
    super("Butterfly", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ResetRolesOnDeath"];
  }
};
