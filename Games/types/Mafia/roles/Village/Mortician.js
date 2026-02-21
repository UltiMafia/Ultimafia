const Role = require("../../Role");

module.exports = class Mortician extends Role {
  constructor(player, data) {
    super("Mortician", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnCondemnedRole",
    ];
  }
};
