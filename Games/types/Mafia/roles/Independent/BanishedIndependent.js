const Role = require("../../Role");

module.exports = class BanishedIndependent extends Role {
  constructor(player, data) {
    super("Banished Independent", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ReplaceWithBanishedRole",
    ];
  }
};
