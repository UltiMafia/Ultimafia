const Role = require("../../Role");

module.exports = class Scapegoat extends Role {
  constructor(player, data) {
    super("Scapegoat", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "FrustratedCondemnation",];
  }
};
