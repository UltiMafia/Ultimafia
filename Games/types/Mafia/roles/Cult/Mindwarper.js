const Role = require("../../Role");

module.exports = class Mindwarper extends Role {
  constructor(player, data) {
    super("Mindwarper", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "MindShifter",
    ];
  }
};
