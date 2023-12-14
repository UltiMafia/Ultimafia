const Role = require("../../Role");

module.exports = class Diviner extends Role {
  constructor(player, data) {
    super("Diviner", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "DivinerPrediction"];
  }
};
