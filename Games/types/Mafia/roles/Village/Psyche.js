const Role = require("../../Role");

module.exports = class Psyche extends Role {
  constructor(player, data) {
    super("Psyche", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "PsychesSenses"];
  }
};
