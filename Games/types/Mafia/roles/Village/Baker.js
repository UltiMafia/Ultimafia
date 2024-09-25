const Role = require("../../Role");

module.exports = class Baker extends Role {
  constructor(player, data) {
    super("Baker", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GiveBread",
      "FamineStarter",
      "FamineImmune",
    ];
  }
};
