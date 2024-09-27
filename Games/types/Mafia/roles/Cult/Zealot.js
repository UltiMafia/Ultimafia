const Role = require("../../Role");

module.exports = class Zealot extends Role {
  constructor(player, data) {
    super("Zealot", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Devotion",
      "ZealotCondemn",
    ];
  }
};
