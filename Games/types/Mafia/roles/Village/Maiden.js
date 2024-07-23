const Role = require("../../Role");

module.exports = class Maiden extends Role {
  constructor(player, data) {
    super("Maiden", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SwapRolesIfEvil"];
  }
};
