const Role = require("../../Role");

module.exports = class Villager7 extends Role {
  constructor(player, data) {
    super("Villager7", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "ConvertToVillager7IfKilledAtNight"];
  }
};
