const Role = require("../../Role");

module.exports = class Bawd extends Role {
  constructor(player, data) {
    super("Bawd", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "SaveTwoAndDeliriate",
    ];
  }
};
