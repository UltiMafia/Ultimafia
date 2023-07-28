const Role = require("../../Role");

module.exports = class Undying extends Role {
  constructor(player, data) {
    super("Undying", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood"];
    this.startEffects = ["ExtraLife"];
  }
};
