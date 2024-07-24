const Role = require("../../Role");

module.exports = class Barber extends Role {
  constructor(player, data) {
    super("Barber", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveShavingCreamOnDeath"];
  }
};
