const Role = require("../../Role");

module.exports = class Superhero extends Role {
  constructor(player, data) {
    super("Superhero", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "WinWithIndependentMajority",
      "GiveSuperpowers",
      "AddDusk",
    ];
  }
};
