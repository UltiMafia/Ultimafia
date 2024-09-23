const Role = require("../../Role");

module.exports = class Terrorist extends Role {
  constructor(player, data) {
    super("Terrorist", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BombRush",
    ];
  }
};
