const Role = require("../../Role");

module.exports = class Oddfather extends Role {
  constructor(player, data) {
    super("Oddfather", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "TenBanishedRoles",
    ];
  }
};
