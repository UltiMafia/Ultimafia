const Role = require("../../Role");

module.exports = class Cartographer extends Role {
  constructor(player, data) {
    super("Cartographer", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "EvilDirection",
    ];
  }
};
