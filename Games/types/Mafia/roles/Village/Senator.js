const Role = require("../../Role");

module.exports = class Senator extends Role {
  constructor(player, data) {
    super("Senator", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
  }
};
