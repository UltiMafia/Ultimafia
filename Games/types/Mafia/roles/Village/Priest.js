const Role = require("../../Role");

module.exports = class Priest extends Role {
  constructor(player, data) {
    super("Priest", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "LearnVisitorsRole",
      "CleanseLycanVisitors",
      "CureAlcoholicVisitors",
      "KillWerewolfVisitors",
      "ConvertKillersOnDeath",
    ];
    this.immunity.wolfBite = 1;
  }
};
