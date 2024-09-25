const Role = require("../../Role");

module.exports = class Diviner extends Role {
  constructor(player, data) {
    super("Diviner", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnGoodAndEvilRole",
    ];
  }
};
