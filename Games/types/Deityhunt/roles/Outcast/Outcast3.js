const Role = require("../../Role");

module.exports = class Outcast3 extends Role {
  constructor(player, data) {
    super("Outcast3", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "OnDeathOutcast3"]; // Not sure how to do the publicly thing
  }
};
