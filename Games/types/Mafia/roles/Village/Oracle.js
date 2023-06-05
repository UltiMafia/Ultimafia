const Role = require("../../Role");

module.exports = class Oracle extends Role {
  constructor(player, data) {
    super("Oracle", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RevealTargetOnDeath"];
  }
};
