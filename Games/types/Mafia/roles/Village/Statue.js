const Role = require("../../Role");

module.exports = class Statue extends Role {
  constructor(player, data) {
    super("Statue", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LoseIfGuessed",
    ];
  }
};
