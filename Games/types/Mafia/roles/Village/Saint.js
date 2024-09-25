const Role = require("../../Role");

module.exports = class Saint extends Role {
  constructor(player, data) {
    super("Saint", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "KillAlignedOnCondemn",
    ];
  }
};
