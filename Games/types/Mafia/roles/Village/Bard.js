const Role = require("../../Role");

module.exports = class Bard extends Role {
  constructor(player, data) {
    super("Bard", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "MindRotEveryoneOnEvilCondemn",
    ];
  }
};
