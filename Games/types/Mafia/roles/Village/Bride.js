const Role = require("../../Role");

module.exports = class Bride extends Role {
  constructor(player, data) {
    super("Bride", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ProposeMarriage"];
  }
};
