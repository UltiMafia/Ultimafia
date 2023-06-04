const Role = require("../../Role");

module.exports = class Virgin extends Role {
  constructor(player, data) {
    super("Virgin", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "PureSacrifice"];
  }
};
