const Role = require("../../Role");

module.exports = class Trickster extends Role {
  constructor(player, data) {
    super("Trickster", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "TricksterReveal"];
  }
};
