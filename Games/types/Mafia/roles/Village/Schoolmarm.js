const Role = require("../../Role");

module.exports = class Schoolmarm extends Role {
  constructor(player, data) {
    super("Schoolmarm", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ConvertTownBlueOnDeath"];
  }
};
