const Role = require("../../Role");

module.exports = class LittleGirl extends Role {
  constructor(player, data) {
    super("Little Girl", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "EavesdropOnEvils"];
  }
};
