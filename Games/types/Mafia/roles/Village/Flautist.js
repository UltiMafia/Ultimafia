const Role = require("../../Role");

module.exports = class Flautist extends Role {
  constructor(player, data) {
    super("Flautist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SwapRolesIfEvil"];
  }
};
