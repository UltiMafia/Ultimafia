const Role = require("../../Role");

module.exports = class Demolitionist extends Role {
  constructor(player, data) {
    super("Demolitionist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BombGiver"];
  }
};
