const Role = require("../../Role");

module.exports = class Saint extends Role {
  constructor(player, data) {
    super("Accountant", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "KillAlignedOnCondemn"];
  }
};
