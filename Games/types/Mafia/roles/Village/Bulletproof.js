const Role = require("../../Role");

module.exports = class Bulletproof extends Role {
  constructor(player, data) {
    super("Bulletproof", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "StartWithArmor"];
  }
};
