const Role = require("../../Role");

module.exports = class Firebrand extends Role {
  constructor(player, data) {
    super("Firebrand", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "DouseInGasoline",
    ];
    this.startItems = ["Match"];
  }
};
