const Role = require("../../Role");

module.exports = class Undertaker extends Role {
  constructor(player, data) {
    super("Undertaker", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddDusk",
      "CleanCondemnation",
    ];
  }
};
