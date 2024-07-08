const Role = require("../../Role");

module.exports = class Hexer extends Role {
  constructor(player, data) {
    super("Hexer", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "CurseWithWordCult",
    ];
  }
};
