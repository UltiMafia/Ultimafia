const Role = require("../../Role");

module.exports = class Gallis extends Role {
  constructor(player, data) {
    super("Gallis", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "FrustratedCondemnation",];
  }
};
