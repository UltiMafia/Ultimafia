const Role = require("../../Role");

module.exports = class Dealer extends Role {
  constructor(player, data) {
    super("Dealer", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CleanseVisitors",
      "CleanseOnRoleShare",
    ];
    this.immunity.wolfBite = 1;
  }
};
