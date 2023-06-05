const Role = require("../../Role");

module.exports = class Gunslinger extends Role {
  constructor(player, data) {
    super("Gunslinger", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "DefendAndSnatchGun"];
  }
};
