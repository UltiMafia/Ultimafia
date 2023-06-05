const Role = require("../../Role");

module.exports = class Visitor extends Role {
  constructor(player, data) {
    super("Visitor", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "Visit"];
  }
};
