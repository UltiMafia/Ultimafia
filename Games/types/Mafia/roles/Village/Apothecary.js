const Role = require("../../Role");

module.exports = class Apothecary extends Role {
  constructor(player, data) {
    super("Apothecary", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CleanseVisitors",
    ];
    this.immunity.wolfBite = 1;
  }
};
