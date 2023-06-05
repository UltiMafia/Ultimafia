const Role = require("../../Role");

module.exports = class Fabulist extends Role {
  constructor(player, data) {
    super("Fabulist", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "Storyteller"];
  }
};
