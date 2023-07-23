const Role = require("../../Role");

module.exports = class Soldier extends Role {
  constructor(player, data) {
    super("Soldier", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
  }
};
