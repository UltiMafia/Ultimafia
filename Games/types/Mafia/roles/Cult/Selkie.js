const Role = require("../../Role");

module.exports = class Selkie extends Role {
  constructor(player, data) {
    super("Selkie", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "MakeTargetsMeet"
    ];
  }
};
