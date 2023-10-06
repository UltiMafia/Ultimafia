const Role = require("../../Role");

module.exports = class Villager extends Role {
  constructor(player, data) {
    super("Villager", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
  }
};
