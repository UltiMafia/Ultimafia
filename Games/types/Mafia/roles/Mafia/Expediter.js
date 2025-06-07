const Role = require("../../Role");

module.exports = class Expediter extends Role {
  constructor(player, data) {
    super("Expediter", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "SetTimer",
    ];
  }
};
