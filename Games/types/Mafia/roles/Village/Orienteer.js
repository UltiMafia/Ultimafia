const Role = require("../../Role");

module.exports = class Orienteer extends Role {
  constructor(player, data) {
    super("Orienteer", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "EvilDirection",
    ];
  }
};
