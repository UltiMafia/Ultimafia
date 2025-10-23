const Role = require("../../Role");

module.exports = class Warden extends Role {
  constructor(player, data) {
    super("Warden", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Choose3toLiveOrDie",
      "AddDawn",
    ];
  }
};
