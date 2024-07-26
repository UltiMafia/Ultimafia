const Role = require("../../Role");

module.exports = class SnakeCharmer extends Role {
  constructor(player, data) {
    super("Snake Charmer", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SwapRolesIfEvil"];
  }
};
