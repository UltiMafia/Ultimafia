const Role = require("../../Role");

module.exports = class Veteran extends Role {
  constructor(player, data) {
    super("Veteran", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "StartWithArmor"];
  }
};
