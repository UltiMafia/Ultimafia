const Role = require("../../Role");

module.exports = class Blackguard extends Role {
  constructor(player, data) {
    super("Blackguard", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "GainAbilitesIfTargetDies",
      "WinWithFaction",
      "MeetingFaction",
    ];
  }
};
