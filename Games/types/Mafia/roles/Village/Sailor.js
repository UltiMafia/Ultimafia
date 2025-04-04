const Role = require("../../Role");

module.exports = class Sailor extends Role {
  constructor(player, data) {
    super("Sailor", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "NightDelirium",
      "KillImmune",
      "CondemnImmune",
    ];
  }
};
