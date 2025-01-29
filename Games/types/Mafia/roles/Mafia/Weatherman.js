const Role = require("../../Role");

module.exports = class Weatherman extends Role {
  constructor(player, data) {
    super("Weatherman", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CreateEvent",
    ];
  }
};
