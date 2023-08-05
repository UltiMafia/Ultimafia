const Role = require("../../Role");

module.exports = class Gemcutter extends Role {
  constructor(player, data) {
    super("Gemcutter", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveCrystal"];
  }
};
