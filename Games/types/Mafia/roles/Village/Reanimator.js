const Role = require("../../Role");

module.exports = class Reanimator extends Role {
  constructor(player, data) {
    super("Reanimator", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveSyringe"];
  }
};
