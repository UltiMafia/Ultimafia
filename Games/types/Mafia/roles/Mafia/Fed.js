const Role = require("../../Role");

module.exports = class Fed extends Role {
  constructor(player, data) {
    super("Fed", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "DiesWithVillageCondemn",
    ];
  }
};
