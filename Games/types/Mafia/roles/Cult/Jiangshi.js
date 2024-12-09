const Role = require("../../Role");

module.exports = class Jiangshi extends Role {
  constructor(player, data) {
    super("Jiangshi", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Add1Banished",
      "KillOrBanishedJump",
    ];
  }
};
