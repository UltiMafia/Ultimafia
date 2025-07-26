const Role = require("../../Role");

module.exports = class Damsal extends Role {
  constructor(player, data) {
    super("Damsal", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LoseIfGuessed",
    ];
  }
};
