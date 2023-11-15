const Role = require("../../Role");

module.exports = class Whig extends Role {
  constructor(player, data) {
    super("Whig", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "MeetWithWhigs",
    ];
  }
};
