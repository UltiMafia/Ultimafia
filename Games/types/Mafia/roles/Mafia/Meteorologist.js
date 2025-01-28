const Role = require("../../Role");

module.exports = class Meteorologist extends Role {
  constructor(player, data) {
    super("Meteorologist", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CreateEvent",
    ];
  }
};
