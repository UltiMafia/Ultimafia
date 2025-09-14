const Role = require("../../Role");

module.exports = class BanishedMafia extends Role {
  constructor(player, data) {
    super("Banished Mafia", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ReplaceWithBanishedRole",
    ];
  }
};
