const Role = require("../../Role");

module.exports = class Blacksmith extends Role {
  constructor(player, data) {
    super("Blacksmith", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ArmorGiver"];
  }
};
