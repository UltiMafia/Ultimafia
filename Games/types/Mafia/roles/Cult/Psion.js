const Role = require("../../Role");

module.exports = class Psion extends Role {
  constructor(player, data) {
    super("Psion", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "MindShifter",
    ];
  }
};
