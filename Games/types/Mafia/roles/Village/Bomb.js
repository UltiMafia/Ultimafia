const Role = require("../../Role");

module.exports = class Bomb extends Role {
  constructor(player, data) {
    super("Bomb", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "StartWithBomb"];
  }
};
