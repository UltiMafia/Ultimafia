const Role = require("../../Role");

module.exports = class BanishedCult extends Role {
  constructor(player, data) {
    super("Banished Cult", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ReplaceWithBanishedRole",
    ];
  }
};
