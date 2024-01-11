const Role = require("../../Role");

module.exports = class Clinician extends Role {
  constructor(player, data) {
    super("Clinician", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "HealVisitors"];
    this.immunity.wolfBite = 1;
  }
};
