const Role = require("../../Role");

module.exports = class Mistress extends Role {
  constructor(player, data) {
    super("Mistress", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "OpenTheDoor"];
  }
};
