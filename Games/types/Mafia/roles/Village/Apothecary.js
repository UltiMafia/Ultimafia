const Role = require("../../Role");

module.exports = class Apothecary extends Role {
  constructor(player, data) {
    super("Apothecary", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CleanseVisitors"];
    this.immunity.wolfBite = 1;
  }
};
