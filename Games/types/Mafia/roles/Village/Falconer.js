const Role = require("../../Role");

module.exports = class Falconer extends Role {
  constructor(player, data) {
    super("Falconer", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveFalcon"];
  }
};
