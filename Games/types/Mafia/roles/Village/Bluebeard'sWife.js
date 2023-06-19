const Role = require("../../Role");

module.exports = class BluebeardsWife extends Role {
  constructor(player, data) {
    super("Bluebeard's Wife", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "OpenTheDoor"];
  }
};
