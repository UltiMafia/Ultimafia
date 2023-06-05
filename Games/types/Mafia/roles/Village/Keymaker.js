const Role = require("../../Role");

module.exports = class Keymaker extends Role {
  constructor(player, data) {
    super("Keymaker", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "KeyGiver"];
  }
};
