const Role = require("../../Role");

module.exports = class Umpire extends Role {
  constructor(player, data) {
    super("Umpire", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "SetTimer",
    ];
  }
};
