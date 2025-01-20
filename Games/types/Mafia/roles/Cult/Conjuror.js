const Role = require("../../Role");

module.exports = class Conjuror extends Role {
  constructor(player, data) {
    super("Conjuror", player, data);
    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CreateEvent",
    ];
  }
};
