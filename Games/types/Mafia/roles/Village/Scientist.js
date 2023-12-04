const Role = require("../../Role");

module.exports = class Scientist extends Role {
  constructor(player, data) {
    super("Scientist", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveSyringe"];
  }
};
