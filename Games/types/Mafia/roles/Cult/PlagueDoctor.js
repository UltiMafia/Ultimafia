const Role = require("../../Role");

module.exports = class PlagueDoctor extends Role {
  constructor(player, data) {
    super("Plague Doctor", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "PlagueStarter",
    ];
  }
};
