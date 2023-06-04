const Role = require("../../Role");

module.exports = class Mourner extends Role {
  constructor(player, data) {
    super("Mourner", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "AskDeadQuestion"];
  }
};
