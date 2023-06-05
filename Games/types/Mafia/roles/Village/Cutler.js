const Role = require("../../Role");

module.exports = class Cutler extends Role {
  constructor(player, data) {
    super("Cutler", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveKnife"];
  }
};
