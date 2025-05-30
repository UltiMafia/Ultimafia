const Role = require("../../Role");

module.exports = class Nun extends Role {
  constructor(player, data) {
    super("Nun", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "RemoveModifers",
    ];
  }
};
