const Role = require("../../Role");

module.exports = class Sorcerer extends Role {
  constructor(player, data) {
    super("Sorcerer", player, data);
    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CreateEvent",
    ];
  }
};
