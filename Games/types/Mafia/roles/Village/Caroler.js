const Role = require("../../Role");

module.exports = class Caroler extends Role {
  constructor(player, data) {
    super("Caroler", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "Carol"];
  }
};
