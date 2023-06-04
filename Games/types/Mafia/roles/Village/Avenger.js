const Role = require("../../Role");

module.exports = class Avenger extends Role {
  constructor(player, data) {
    super("Avenger", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GetGunIfTargetDies"];
  }
};
