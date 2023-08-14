const Role = require("../../Role");

module.exports = class Bomber extends Role {
  constructor(player, data) {
    super("Bomber", player, data);
    
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "StartWithBomb"];
  }
};
