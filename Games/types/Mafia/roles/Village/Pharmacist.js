const Role = require("../../Role");

module.exports = class Pharmacist extends Role {
  constructor(player, data) {
    super("Pharmacist", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "GiveWhiskey",
    ];
  }
};
