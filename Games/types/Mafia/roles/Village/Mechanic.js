const Role = require("../../Role");

module.exports = class Mechanic extends Role {
  constructor(player, data) {
    super("Mechanic", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "FixAllItems",
      "FixOwnItems",
    ];
  }
};
