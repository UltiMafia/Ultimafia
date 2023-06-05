const Role = require("../../Role");

module.exports = class Resurrectionist extends Role {
  constructor(player, data) {
    super("Resurrectionist", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "Revive"];
  }
};
