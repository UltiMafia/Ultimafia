const Role = require("../../Role");

module.exports = class Minstrel extends Role {
  constructor(player, data) {
    super("Minstrel", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "MindRotEveryoneOnEvilCondemn",
    ];
  }
};
