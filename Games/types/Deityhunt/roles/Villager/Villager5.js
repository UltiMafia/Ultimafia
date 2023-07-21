const Role = require("../../Role");

module.exports = class Villager5 extends Role {
  constructor(player, data) {
    super("Villager5", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CompareAlignments"];
  }
};
