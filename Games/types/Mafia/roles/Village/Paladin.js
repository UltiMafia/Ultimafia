const Role = require("../../Role");

module.exports = class Paladin extends Role {
  constructor(player, data) {
    super("Paladin", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "GainAbilitesIfTargetDies",
      "WinWithFaction",
      "MeetingFaction",
    ];
  }
};
