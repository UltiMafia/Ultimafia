const Role = require("../../Role");

module.exports = class BluebeardsWife extends Role {
  constructor(player, data) {
    super("Bluebeards Wife", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "OpenTheDoor"];
  }
};
