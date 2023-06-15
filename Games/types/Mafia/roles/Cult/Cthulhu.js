const Role = require("../../Role");

module.exports = class Cthulhu extends Role {
  constructor(player, data) {
    super("Cthulhu", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "MakeVisitorsInsane",
    ];
  }
};
