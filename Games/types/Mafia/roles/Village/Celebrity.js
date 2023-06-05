const Role = require("../../Role");

module.exports = class Celebrity extends Role {
  constructor(player, data) {
    super("Celebrity", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "PublicReveal"];
  }
};
