const Role = require("../../Role");

module.exports = class Shepherd extends Role {
  constructor(player, data) {
    super("Shepherd", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GuideWithFaith",
    ];
  }
};
