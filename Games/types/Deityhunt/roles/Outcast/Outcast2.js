const Role = require("../../Role");

module.exports = class Outcast2 extends Role {
  constructor(player, data) {
    super("Outcast2", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "OnDeathOutcast2"]; // Not sure how to do the publicly thing
  }
};
