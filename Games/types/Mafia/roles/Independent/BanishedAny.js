const Role = require("../../Role");

module.exports = class BanishedAny extends Role {
  constructor(player, data) {
    super("Banished Any", player, data);

    this.alignment = "Any";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ReplaceWithBanishedRole",
    ];
  }
};
