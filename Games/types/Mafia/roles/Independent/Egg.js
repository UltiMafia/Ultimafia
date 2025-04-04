const Role = require("../../Role");

module.exports = class Egg extends Role {
  constructor(player, data) {
    super("Egg", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "ConvertSelfToChosenRole",
    ];
  }
};
