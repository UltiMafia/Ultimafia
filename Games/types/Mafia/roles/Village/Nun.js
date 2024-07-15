const Role = require("../../Role");

module.exports = class Nun extends Role {
  constructor(player, data) {
    super("Nun", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RemoveModifers"];
  }
};
