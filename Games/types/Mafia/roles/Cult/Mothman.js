const Role = require("../../Role");

module.exports = class Mothman extends Role {
  constructor(player, data) {
    super("Mothman", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Choose3toLiveOrDie",
    ];
  }
};
