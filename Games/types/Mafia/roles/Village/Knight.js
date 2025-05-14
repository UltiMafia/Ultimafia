const Role = require("../../Role");

module.exports = class Knight extends Role {
  constructor(player, data) {
    super("Knight", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ShieldGiver",
    ];
  }
};
