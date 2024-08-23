const Role = require("../../Role");

module.exports = class Magistrate extends Role {
  constructor(player, data) {
    super("Magistrate", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "HouseArrest",
    ];
  }
};
