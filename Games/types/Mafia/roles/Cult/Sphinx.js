const Role = require("../../Role");

module.exports = class Sphinx extends Role {
  constructor(player, data) {
    super("Sphinx", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Choose3toLiveOrDie",
    ];
  }
};
