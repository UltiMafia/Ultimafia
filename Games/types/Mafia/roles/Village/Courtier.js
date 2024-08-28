const Role = require("../../Role");

module.exports = class Courtier extends Role {
  constructor(player, data) {
    super("Courtier", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MindRotRoleFor3Nights"];
  }
};
