const Role = require("../../Role");

module.exports = class Tarotist extends Role {
  constructor(player, data) {
    super("Tarotist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "Learn2ExcessOr1Role"];
  }
};
