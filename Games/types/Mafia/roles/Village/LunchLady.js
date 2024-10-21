const Role = require("../../Role");

module.exports = class LunchLady extends Role {
  constructor(player, data) {
    super("Lunch Lady", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "RemoveModifers",
    ];
  }
};
