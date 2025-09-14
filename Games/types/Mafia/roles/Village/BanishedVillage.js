const Role = require("../../Role");

module.exports = class BanishedVillage extends Role {
  constructor(player, data) {
    super("Banished Village", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ReplaceWithBanishedRole",
    ];
  }
};
