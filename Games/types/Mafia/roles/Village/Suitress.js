const Role = require("../../Role");

module.exports = class Suitress extends Role {
  constructor(player, data) {
    super("Suitress", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ProposeMarriage"];
  }
};
