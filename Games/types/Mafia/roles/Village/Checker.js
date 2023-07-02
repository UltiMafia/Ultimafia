const Role = require("../../Role");

module.exports = class Checker extends Role {
  constructor(player, data) {
    super("Checker", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CheckIfVisitIsSuccessful"];
  }
};
