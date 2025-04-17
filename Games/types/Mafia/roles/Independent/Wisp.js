const Role = require("../../Role");

module.exports = class Wisp extends Role {
  constructor(player, data) {
    super("Wisp", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WispConvert", "WinWithWisps"];

  }
};
