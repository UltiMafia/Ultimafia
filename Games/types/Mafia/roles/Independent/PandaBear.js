const Role = require("../../Role");

module.exports = class PandaBear extends Role {
  constructor(player, data) {
    super("Panda Bear", player, data);
    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = [
      "VillageCore",
      "WinWithoutMating",
      "SearchForMate",
    ];
  }
};
