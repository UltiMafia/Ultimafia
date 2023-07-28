const Role = require("../../Role");

module.exports = class Blunderer extends Role {
  constructor(player, data) {
    super("Blunderer", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "OnDeathBlunderer"]; // Not sure how to do the publicly thing
  }
};
