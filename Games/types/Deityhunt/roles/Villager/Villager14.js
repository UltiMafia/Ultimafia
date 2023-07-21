const Role = require("../../Role");

module.exports = class Villager14 extends Role {
  constructor(player, data) {
    super("Villager14", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood"];
    this.startEffects = ["ExtraLife"];
  }
};
