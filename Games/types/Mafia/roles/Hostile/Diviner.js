const Role = require("../../Role");

module.exports = class Diviner extends Role {
  constructor(player, data) {
    super("Diviner", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "DivinerPrediction"];
  }
};
