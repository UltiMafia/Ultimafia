const Role = require("../../Role");

module.exports = class Fly extends Role {
  constructor(player, data) {
    super("Fly", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "EavesdropOnEvils"];
  }
};
