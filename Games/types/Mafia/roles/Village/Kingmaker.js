const Role = require("../../Role");

module.exports = class Kingmaker extends Role {
  constructor(player, data) {
    super("Kingmaker", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveCrown"];
  }
};
