const Role = require("../../Role");

module.exports = class Funsmith extends Role {
  constructor(player, data) {
    super("Funsmith", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "GiveGun",
      "GiveVisitorsGuns",
    ];
  }
};
