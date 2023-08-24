const Role = require("../../Role");

module.exports = class Medic extends Role {
  constructor(player, data) {
    super("Medic", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "DonateLife"];
  }
};
